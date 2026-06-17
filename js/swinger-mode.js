(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createSwingerMode(opts){
    opts = opts || {};
    var els = opts.els || {};
    var runState = opts.runState;
    var targetSystem = opts.targetSystem;
    var motionSystem = opts.motionSystem;

    function getState(){ return opts.getState(); }
    function setState(value){ opts.setState(value); }
    function getRafId(){ return opts.getRafId(); }
    function setRafId(value){ opts.setRafId(value); }

    function getConfig(){
      var physicalActive = targetSystem.canUseSwingPhysicalDimensions();
      var radius = Math.max(10, parseFloat(els.swingTargetHeight.value) || 300);
      var axisHeight = Math.max(0, parseFloat(els.swingAxisHeight.value) || 0);
      if(physicalActive){
        radius = Math.max(10, targetSystem.projectedFeetToPx(parseFloat(els.swingTargetHeightFt.value) || 2));
        axisHeight = Math.max(0, targetSystem.projectedFeetToPx(parseFloat(els.swingAxisHeightFt.value) || 0));
      }
      return {
        peakRate: Math.max(1, parseFloat(els.swingRate.value) || 180),
        radius: radius,
        axisHeight: axisHeight
      };
    }

    function getTargetSpec(){
      var shape = targetSystem.getSelectedTargetShape();
      var size = Math.max(10, targetSystem.getTargetSizeConfig().fixedSize);
      var dims = targetSystem.getTargetDimensions(shape, size);
      var color = targetSystem.resolveTargetColor(0);
      return {
        shape: shape,
        size: size,
        dims: dims,
        color: color,
        signature: [shape, size.toFixed(3), color].join('|')
      };
    }

    function getTargetPosition(angleDeg, dims, config){
      var metrics = targetSystem.getBoardMetrics();
      var pivotX = metrics.width / 2;
      var pivotY = metrics.height - config.axisHeight;
      var radians = angleDeg * Math.PI / 180;
      var centerX = pivotX + Math.sin(radians) * config.radius;
      var centerY = pivotY - Math.cos(radians) * config.radius;
      return {
        left: centerX - dims.width / 2,
        top: centerY - dims.height / 2
      };
    }

    function positionTarget(target, angleDeg, dims, config){
      if(!target) return;
      var pos = getTargetPosition(angleDeg, dims, config);
      target.style.left = pos.left.toFixed(2) + 'px';
      target.style.top = pos.top.toFixed(2) + 'px';
      target.style.transform = 'rotate(' + angleDeg.toFixed(3) + 'deg)';
    }

    function renderTarget(angleDeg){
      var board = els.targetBoard;
      if(!board) return null;
      board.innerHTML = '';
      var spec = getTargetSpec();
      var config = getConfig();
      var pos = getTargetPosition(angleDeg, spec.dims, config);
      var target = targetSystem.createTargetElement(board, 1, spec.size, pos.left, pos.top, spec.shape, spec.color, false);
      target.classList.add('swinger-target');
      positionTarget(target, angleDeg, spec.dims, config);
      var state = getState();
      if(state){
        state.target = target;
        state.targetDims = spec.dims;
        state.targetSignature = spec.signature;
      }
      return target;
    }

    function updateTarget(angleDeg){
      var state = getState();
      if(!state) return;
      var spec = getTargetSpec();
      if(!state.target || !state.target.parentNode || state.targetSignature !== spec.signature){
        renderTarget(angleDeg);
        return;
      }
      state.targetDims = spec.dims;
      positionTarget(state.target, angleDeg, spec.dims, getConfig());
    }

    function stepTarget(now){
      var state = getState();
      if(!state){
        setRafId(0);
        return;
      }
      if(!state.lastFrame){ state.lastFrame = now; }
      var dt = Math.max(0, (now - state.lastFrame) / 1000);
      state.lastFrame = now;
      var config = getConfig();
      var segmentDuration = Math.max(0.05, 180 / config.peakRate);
      state.phase = (state.phase + dt / segmentDuration) % 4;
      updateTarget(motionSystem.swingerAngleFromPhase(state.phase));
      setRafId(global.requestAnimationFrame(stepTarget));
    }

    function start(){
      opts.stopRun(true);
      var runToken = runState.begin('swinger', 'running');
      setState({ running: true, lastFrame: 0, phase: 0, target: null, targetDims: null, targetSignature: '', runToken: runToken });
      els.startBtn.disabled = true;
      els.stopBtn.disabled = false;
      els.selectedDelay.textContent = '-';
      opts.setBoardHidden(false);
      opts.setAwaitingReveal(false);
      opts.setStatus('Swinger active');
      renderTarget(motionSystem.swingerAngleFromPhase(getState().phase));
      setRafId(global.requestAnimationFrame(stepTarget));
    }

    function stop(skipStatus){
      if(getRafId()){
        global.cancelAnimationFrame(getRafId());
        setRafId(0);
      }
      if(getState() && !skipStatus){ opts.setStatus('Stopped'); }
      setState(null);
    }

    return {
      getConfig: getConfig,
      renderTarget: renderTarget,
      updateTarget: updateTarget,
      stepTarget: stepTarget,
      start: start,
      stop: stop
    };
  }

  ns.swingerMode = {
    createSwingerMode: createSwingerMode
  };
})(window);
