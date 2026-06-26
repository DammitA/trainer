/*
 * SPDX-FileCopyrightText: 2026 Alexander Doner
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createAudioScheduler(){
    var audioCtx = null;
    var audioPrimed = false;
    var activeNodes = [];

    async function ensureAudio(){
      if(!audioCtx){ audioCtx = new (global.AudioContext || global.webkitAudioContext)(); }
      if(audioCtx.state !== 'running'){
        try{ await audioCtx.resume(); }catch(e){}
      }
      if(!audioPrimed){
        try{
          var buffer = audioCtx.createBuffer(1, audioCtx.sampleRate / 10, audioCtx.sampleRate);
          var channel = buffer.getChannelData(0);
          for(var i=0;i<channel.length;i++){ channel[i] = 0; }
          var src = audioCtx.createBufferSource();
          src.buffer = buffer;
          var gain = audioCtx.createGain();
          gain.gain.value = 0;
          src.connect(gain);
          gain.connect(audioCtx.destination);
          src.start();
          src.stop(audioCtx.currentTime + 0.05);
        }catch(e){}
        audioPrimed = true;
      }
      return audioCtx;
    }

    function removeActiveNode(node){
      var idx = activeNodes.indexOf(node);
      if(idx !== -1){ activeNodes.splice(idx, 1); }
      try{ node.disconnect(); }catch(e){}
    }

    function cleanupNodes(){
      activeNodes.forEach(function(node){
        try{ if(typeof node.stop === 'function'){ node.stop(); } }catch(e){}
        try{ node.disconnect(); }catch(e){}
      });
      activeNodes.length = 0;
    }

    function beepAt(freq, len, startTime){
      if(!audioCtx || audioCtx.state !== 'running') return;
      var start = Math.max(audioCtx.currentTime, startTime || audioCtx.currentTime);
      var duration = Math.max(0.05, len);
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(1, start + 0.01);
      gain.gain.linearRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
      osc.addEventListener('ended', function(){ removeActiveNode(osc); removeActiveNode(gain); });
      activeNodes.push(osc, gain);
    }

    function beepNow(freq, len){
      if(!audioCtx || audioCtx.state !== 'running') return;
      beepAt(freq, len, audioCtx.currentTime);
    }

    function currentTime(){
      return audioCtx ? audioCtx.currentTime : 0;
    }

    return {
      ensureAudio: ensureAudio,
      cleanupNodes: cleanupNodes,
      beepAt: beepAt,
      beepNow: beepNow,
      currentTime: currentTime
    };
  }

  ns.audio = {
    createAudioScheduler: createAudioScheduler
  };
})(window);
