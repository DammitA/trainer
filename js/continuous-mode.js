(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createContinuousMode(opts){
    opts = opts || {};
    var els = opts.els || {};
    var audio = opts.audio;
    var runState = opts.runState;
    var targetSystem = opts.targetSystem;
    var motionSystem = opts.motionSystem;

    function getState(){ return opts.getState(); }
    function setState(value){ opts.setState(value); }
    function getPlan(){ return opts.getPlan(); }
    function setPlan(value){ opts.setPlan(value); }
    function getRafId(){ return opts.getRafId(); }
    function setRafId(value){ opts.setRafId(value); }
    function addTimer(timerId){ opts.addTimer(timerId); }

    function createTarget(){
      var state = getState();
      if(!state || !els.targetBoard) return;
      var metrics = targetSystem.getBoardMetrics();
      var shape = targetSystem.getSelectedTargetShape();
      var numbered = !!(els.targetNumbered && els.targetNumbered.checked);
      var speed = Math.max(10, parseFloat(els.flowSpeed.value) || 0);
      var startEdge = els.flowEdge && els.flowEdge.value ? els.flowEdge.value : 'left';
      var alternateEdge = !!(els.flowAlternate && els.flowAlternate.checked);
      var placement = els.flowPlacement && els.flowPlacement.value ? els.flowPlacement.value : 'random';
      var size = Math.max(10, targetSystem.sampleTargetSize(targetSystem.getTargetSizeConfig()));
      var dims = targetSystem.getTargetDimensions(shape, size);
      var x = 0;
      var y = 0;
      var vx = 0;
      var vy = 0;
      if(startEdge === 'border'){
        var border = motionSystem.borderSpawnData(metrics, dims, placement, alternateEdge);
        x = border.x;
        y = border.y;
        vx = border.dirX * speed;
        vy = border.dirY * speed;
      } else {
        var edge = alternateEdge && (state.spawnIndex % 2 === 1) ? motionSystem.oppositeEdge(startEdge) : startEdge;
        var maxOffset = (edge === 'left' || edge === 'right') ? Math.max(0, metrics.height - dims.height) : Math.max(0, metrics.width - dims.width);
        var offset = placement === 'ordered'
          ? (alternateEdge ? motionSystem.orderedLinearOffset(maxOffset, size) : motionSystem.orderedOffset(maxOffset, size))
          : Math.random() * maxOffset;

        if(edge === 'left'){
          x = -dims.width;
          y = offset;
          vx = speed;
        } else if(edge === 'right'){
          x = metrics.width;
          y = offset;
          vx = -speed;
        } else if(edge === 'top'){
          x = offset;
          y = -dims.height;
          vy = speed;
        } else {
          x = offset;
          y = metrics.height;
          vy = -speed;
        }
      }

      state.spawnIndex += 1;
      var label = state.nextLabel;
      state.nextLabel += 1;
      var el = targetSystem.createTargetElement(els.targetBoard, label, size, x, y, shape, targetSystem.resolveTargetColor(state.spawnIndex - 1), numbered);
      state.targets.push({ el: el, x: x, y: y, vx: vx, vy: vy, width: dims.width, height: dims.height });

      if(state.spawningActive && state.stopMode === 'targets' && state.spawnIndex >= state.stopTargetCount){
        completeSpawning();
      }
    }

    function stepTargets(now){
      var state = getState();
      if(!state){
        setRafId(0);
        return;
      }
      if(!state.lastFrame){ state.lastFrame = now; }
      var dt = Math.max(0, (now - state.lastFrame) / 1000);
      state.lastFrame = now;
      var metrics = targetSystem.getBoardMetrics();
      var plan = getPlan();
      if(state.spawningActive){
        var rate = Math.max(0.1, parseFloat(els.flowRate.value) || 0);
        state.spawnAccumulator += dt * rate;
        while(state.spawningActive && state.spawnAccumulator >= 1){
          createTarget();
          state.spawnAccumulator -= 1;
        }
        if(state.spawningActive && state.stopMode === 'time' && plan && plan.active && performance.now() >= plan.stopAt){
          completeSpawning();
        }
      }

      var survivors = [];
      for(var i=0;i<state.targets.length;i++){
        var target = state.targets[i];
        target.x += target.vx * dt;
        target.y += target.vy * dt;
        var outOfBounds = (
          target.x > metrics.width + target.width ||
          target.x + target.width < 0 ||
          target.y > metrics.height + target.height ||
          target.y + target.height < 0
        );
        if(outOfBounds){
          if(target.el && target.el.parentNode){ target.el.parentNode.removeChild(target.el); }
          continue;
        }
        target.el.style.left = target.x.toFixed(2) + 'px';
        target.el.style.top = target.y.toFixed(2) + 'px';
        survivors.push(target);
      }
      state.targets = survivors;

      if(!state.spawningActive && state.targets.length === 0){
        setState(null);
        if(getRafId()){
          global.cancelAnimationFrame(getRafId());
          setRafId(0);
        }
        return;
      }
      setRafId(global.requestAnimationFrame(stepTargets));
    }

    function completeSpawning(){
      var plan = getPlan();
      var state = getState();
      if(!plan || !plan.active || !state){ return; }
      if(!runState.isTokenActive(plan.runToken)){ return; }
      if(plan.bypassStopwatch){ return; }
      if(plan.stopCuePlayed){ return; }
      plan.stopCuePlayed = true;
      plan.active = false;
      state.spawningActive = false;
      runState.finish();
      try{
        audio.beepNow(Math.max(50, parseFloat(els.stopFreq.value) || 0), Math.max(0.05, parseFloat(els.stopLen.value) || 0.1));
      }catch(e){}
      els.startBtn.disabled = false;
      els.stopBtn.disabled = true;
      els.selectedDelay.textContent = '-';
      opts.setStatus('Completed');
    }

    async function start(){
      opts.stopRun(true);
      els.startBtn.disabled = true;
      els.stopBtn.disabled = false;
      await audio.ensureAudio();
      opts.renderTargets();
      var runToken = runState.begin('continuous', 'waiting');
      var delay = opts.readRandomStartDelay();
      var bypassStopwatch = !!(els.flowBypassStopwatch && els.flowBypassStopwatch.checked);
      var stopMode = bypassStopwatch ? 'manual' : opts.getContinuousStopMode();
      var stopValue = bypassStopwatch ? 0 : opts.getContinuousStopValue();
      var startFrequency = Math.max(50, parseFloat(els.startFreq.value) || 0);
      var startLength = Math.max(0.05, parseFloat(els.startLen.value) || 0.1);
      var cueFrequency = Math.max(50, parseFloat(els.stopFreq.value) || 0);
      var cueLength = Math.max(0.05, parseFloat(els.stopLen.value) || 0.1);
      var now = performance.now();
      setPlan({
        active: true,
        startAt: now + delay * 1000,
        stopAt: stopMode === 'time' ? now + (delay + stopValue) * 1000 : null,
        delay: delay,
        stopMode: stopMode,
        stopValue: stopValue,
        bypassStopwatch: bypassStopwatch,
        startFreq: startFrequency,
        startLen: startLength,
        stopFreq: cueFrequency,
        stopLen: cueLength,
        stopCuePlayed: false,
        runToken: runToken
      });
      setState({
        running: true,
        lastFrame: 0,
        spawnAccumulator: 0,
        spawnIndex: 0,
        nextLabel: 1,
        targets: [],
        spawningActive: false,
        stopMode: stopMode,
        bypassStopwatch: bypassStopwatch,
        stopTargetCount: stopMode === 'targets' ? stopValue : 0
      });
      els.selectedDelay.textContent = delay.toFixed(2) + ' s';
      opts.setBoardHidden(false);
      opts.setAwaitingReveal(false);
      opts.setStatus('Waiting for start beep...');

      audio.beepAt(startFrequency, startLength, audio.currentTime() + delay);

      addTimer(setTimeout(function(){
        var activePlan = getPlan();
        var activeState = getState();
        if(!activePlan || !activePlan.active || !activeState || !runState.isTokenActive(runToken)) return;
        activeState.spawningActive = true;
        activeState.lastFrame = performance.now();
        activeState.spawnAccumulator = 0;
        createTarget();
        runState.transition('running');
        opts.setStatus('Continuous flow active');
        setRafId(global.requestAnimationFrame(stepTargets));
      }, delay * 1000));

      if(stopMode === 'time'){
        addTimer(setTimeout(function(){
          var activePlan = getPlan();
          if(!activePlan || !activePlan.active || !runState.isTokenActive(runToken)) return;
          completeSpawning();
        }, (delay + stopValue) * 1000));
      }
    }

    function stop(skipStatus){
      if(getRafId()){
        global.cancelAnimationFrame(getRafId());
        setRafId(0);
      }
      var state = getState();
      if(state && state.targets){
        state.targets.forEach(function(target){
          if(target.el && target.el.parentNode){ target.el.parentNode.removeChild(target.el); }
        });
      }
      if(state && !skipStatus){ opts.setStatus('Stopped'); }
      setState(null);
      setPlan(null);
    }

    return {
      createTarget: createTarget,
      stepTargets: stepTargets,
      completeSpawning: completeSpawning,
      start: start,
      stop: stop
    };
  }

  ns.continuousMode = {
    createContinuousMode: createContinuousMode
  };
})(window);
