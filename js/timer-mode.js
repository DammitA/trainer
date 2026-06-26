/*
 * SPDX-FileCopyrightText: 2026 Alexander Doner
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createTimerMode(opts){
    opts = opts || {};
    var els = opts.els || {};
    var audio = opts.audio;
    var runState = opts.runState;

    function getPlan(){ return opts.getPlan(); }
    function setPlan(value){ opts.setPlan(value); }
    function getRepeatState(){ return opts.getRepeatState(); }
    function setRepeatState(value){ opts.setRepeatState(value); }
    function getAwaitingReveal(){ return opts.getAwaitingReveal(); }
    function setAwaitingReveal(value){ opts.setAwaitingReveal(value); }
    function addTimer(timerId){ opts.addTimer(timerId); }

    function readRandomStartDelay(){
      var minDelay = Math.max(0, parseFloat(els.delayMin.value));
      var maxDelay = Math.max(0, parseFloat(els.delayMax.value));
      if(isNaN(minDelay)) minDelay = 0;
      if(isNaN(maxDelay)) maxDelay = minDelay;
      if(maxDelay < minDelay){ var tmp = minDelay; minDelay = maxDelay; maxDelay = tmp; }
      return minDelay + Math.random() * (maxDelay - minDelay);
    }

    function buildShotDefinedTimeline(){
      var events = [];
      var drawDelay = readRandomStartDelay();
      var firstShotTime = Math.max(0, parseFloat(els.firstShotTime.value) || 0);
      var split = Math.max(0, parseFloat(els.shotSplit.value) || 0);
      var reloadGap = Math.max(0, parseFloat(els.reloadTime.value) || 0);
      var shotsPerString = Math.max(1, Math.floor(parseFloat(els.shotCount.value) || 1));
      var strings = Math.max(1, Math.floor(parseFloat(els.shotReloads.value) || 0) + 1);
      var t = drawDelay;
      var shotIndex = 1;
      var seg;
      var i;

      events.push({ t: t, type: 'draw' });
      t += firstShotTime;

      for(seg = 0; seg < strings; seg++){
        for(i = 0; i < shotsPerString; i++){
          events.push({ t: t, type: 'shot', n: shotIndex });
          shotIndex += 1;
          var lastShotInString = i === shotsPerString - 1;
          var lastString = seg === strings - 1;
          if(!(lastString && lastShotInString)){
            if(lastShotInString){
              t += reloadGap;
              events.push({ t: t, type: 'reload' });
            } else {
              t += split;
            }
          }
        }
      }
      return { events: events, total: t, delay: drawDelay };
    }

    function startShotDefinedPresentation(){
      opts.clearTimers();
      audio.cleanupNodes();
      opts.renderTargets();
      var runToken = runState.begin('shot-defined', 'waiting');
      var timeline = buildShotDefinedTimeline();
      var startFrequency = Math.max(50, parseFloat(els.startFreq.value) || 0);
      var startLength = Math.max(0.05, parseFloat(els.startLen.value) || 0.1);
      var cueFrequency = Math.max(50, parseFloat(els.stopFreq.value) || 0);
      var cueLength = Math.max(0.05, parseFloat(els.stopLen.value) || 0.1);
      var now = performance.now();

      setPlan({
        mode: 'shot',
        startAt: now + timeline.delay * 1000,
        stopAt: now + timeline.total * 1000,
        delay: timeline.delay,
        duration: Math.max(0, timeline.total - timeline.delay),
        startFreq: startFrequency,
        startLen: startLength,
        stopFreq: cueFrequency,
        stopLen: cueLength,
        runToken: runToken
      });

      if(els.hideTargets && els.hideTargets.checked){ setAwaitingReveal(true); opts.setBoardHidden(true); }
      else { setAwaitingReveal(false); opts.setBoardHidden(false); }
      els.startBtn.disabled = true;
      els.stopBtn.disabled = false;
      els.selectedDelay.textContent = timeline.delay.toFixed(2) + ' s';
      opts.setStatus('Waiting for draw beep...');

      var audioBaseTime = audio.currentTime();
      timeline.events.forEach(function(ev){
        if(ev.type === 'draw'){
          audio.beepAt(startFrequency, startLength, audioBaseTime + Math.max(0, ev.t));
        } else {
          audio.beepAt(cueFrequency, cueLength, audioBaseTime + Math.max(0, ev.t));
        }
        addTimer(setTimeout(function(){
          if(!getPlan() || !runState.isTokenActive(runToken)) return;
          if(ev.type === 'draw'){
            if(getAwaitingReveal()){ setAwaitingReveal(false); opts.setBoardHidden(false); }
            runState.transition('running');
            opts.setStatus('Run active');
          } else if(ev.type === 'shot'){
            opts.setStatus('Shot ' + ev.n);
          } else if(ev.type === 'reload'){
            opts.setStatus('Reload');
          }
        }, Math.max(0, ev.t) * 1000));
      });

      addTimer(setTimeout(function(){
        if(!getPlan() || !runState.isTokenActive(runToken)) return;
        if(els.hideTargets && els.hideTargets.checked && els.targetBoard){ els.targetBoard.innerHTML = ''; }
        setAwaitingReveal(false);
        opts.setBoardHidden(false);
        runState.finish();
        opts.setStatus('Completed');
        addTimer(setTimeout(function(){ finalizeRun(); }, Math.max(0, cueLength) * 1000 + 120));
      }, Math.max(0, timeline.total) * 1000));
    }

    function startTimedPresentation(){
      opts.clearTimers();
      audio.cleanupNodes();
      opts.renderTargets();
      var runToken = runState.begin('timed', 'waiting');
      var duration = Math.max(0, parseFloat(els.workDuration.value));
      var startFrequency = Math.max(50, parseFloat(els.startFreq.value) || 0);
      var startLength = Math.max(0.05, parseFloat(els.startLen.value) || 0.1);
      var stopFrequency = Math.max(50, parseFloat(els.stopFreq.value) || 0);
      var stopLength = Math.max(0.05, parseFloat(els.stopLen.value) || 0.1);
      var repeatState = getRepeatState();
      var isRepeatPresentation = !!(repeatState && repeatState.presentationIndex > 0);
      var delay = isRepeatPresentation ? 0 : readRandomStartDelay();
      var now = performance.now();

      if(isNaN(duration)){ duration = 0; }
      if(repeatState){
        repeatState.presentationIndex += 1;
        setRepeatState(repeatState);
      }

      setPlan({
        startAt: now + delay * 1000,
        stopAt: now + (delay + duration) * 1000,
        delay: delay,
        duration: duration,
        startFreq: startFrequency,
        startLen: startLength,
        stopFreq: stopFrequency,
        stopLen: stopLength,
        runToken: runToken
      });

      if(els.hideTargets && els.hideTargets.checked){ setAwaitingReveal(true); opts.setBoardHidden(true); }
      else { setAwaitingReveal(false); opts.setBoardHidden(false); }
      els.startBtn.disabled = true;
      els.stopBtn.disabled = false;
      els.selectedDelay.textContent = delay.toFixed(2) + ' s';
      opts.setStatus('Waiting for start beep\u2026');

      var audioBaseTime = audio.currentTime();
      audio.beepAt(startFrequency, startLength, audioBaseTime + delay);
      audio.beepAt(stopFrequency, stopLength, audioBaseTime + delay + duration);

      addTimer(setTimeout(function(){
        if(!getPlan() || !runState.isTokenActive(runToken)) return;
        if(getAwaitingReveal()){ setAwaitingReveal(false); opts.setBoardHidden(false); }
        runState.transition('running');
        opts.setStatus('Run active');
      }, delay * 1000));

      addTimer(setTimeout(function(){
        var activePlan = getPlan();
        if(!activePlan || !runState.isTokenActive(runToken)) return;
        if(els.hideTargets && els.hideTargets.checked && els.targetBoard){ els.targetBoard.innerHTML = ''; }
        setAwaitingReveal(false);
        opts.setBoardHidden(false);
        runState.finish();
        opts.setStatus('Completed');
        addTimer(setTimeout(function(){ finalizeRun(); }, Math.max(0, activePlan.stopLen || 0) * 1000 + 120));
      }, (delay + duration) * 1000));
    }

    function finalizeRun(){
      opts.clearTimers();
      audio.cleanupNodes();

      var repeatState = getRepeatState();
      if(repeatState && repeatState.remaining > 0){
        repeatState.remaining -= 1;
        setRepeatState(repeatState);
        var reloadState = runState.transition('reloading');
        setPlan(null);
        setAwaitingReveal(false);
        opts.setBoardHidden(false);
        if(els.hideTargets && els.hideTargets.checked && els.targetBoard){ els.targetBoard.innerHTML = ''; }
        els.countStart.textContent = '\u2014';
        els.countStop.textContent = '\u2014';
        els.selectedDelay.textContent = '\u2014';
        els.startBtn.disabled = true;
        els.stopBtn.disabled = false;
        opts.setStatus('Reloading\u2026');

        addTimer(setTimeout(function(){
          if(!getRepeatState() || !runState.isTokenActive(reloadState.token)) return;
          startTimedPresentation();
        }, Math.max(0, repeatState.reloadTime || 0) * 1000));
        return;
      }

      setRepeatState(null);
      setPlan(null);
      runState.stop();
      opts.stopContinuousRun(true);
      opts.stopSwingerRun(true);
      els.startBtn.disabled = false;
      els.stopBtn.disabled = true;
      els.countStart.textContent = '\u2014';
      els.countStop.textContent = '\u2014';
      setAwaitingReveal(false);
      opts.setBoardHidden(false);
    }

    return {
      readRandomStartDelay: readRandomStartDelay,
      buildShotDefinedTimeline: buildShotDefinedTimeline,
      startShotDefinedPresentation: startShotDefinedPresentation,
      startTimedPresentation: startTimedPresentation,
      finalizeRun: finalizeRun
    };
  }

  ns.timerMode = {
    createTimerMode: createTimerMode
  };
})(window);
