(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createRunStateMachine(){
    var current = {
      mode: 'idle',
      phase: 'idle',
      token: 0
    };

    function snapshot(){
      return {
        mode: current.mode,
        phase: current.phase,
        token: current.token
      };
    }

    function begin(mode, phase){
      current = {
        mode: mode || 'unknown',
        phase: phase || 'starting',
        token: current.token + 1
      };
      return current.token;
    }

    function transition(phase){
      current.phase = phase || current.phase;
      return snapshot();
    }

    function finish(){
      current.phase = 'completed';
      return snapshot();
    }

    function stop(){
      current = {
        mode: 'idle',
        phase: 'idle',
        token: current.token + 1
      };
      return current.token;
    }

    function isActive(){
      return current.phase !== 'idle' && current.phase !== 'completed' && current.phase !== 'stopped';
    }

    function isTokenActive(token){
      return token === current.token && isActive();
    }

    return {
      begin: begin,
      transition: transition,
      finish: finish,
      stop: stop,
      snapshot: snapshot,
      isActive: isActive,
      isTokenActive: isTokenActive
    };
  }

  ns.runState = {
    createRunStateMachine: createRunStateMachine
  };
})(window);
