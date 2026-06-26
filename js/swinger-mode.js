/*
 * SPDX-FileCopyrightText: 2026 Alexander Doner
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createSwingerMode(opts){
    opts = opts || {};
    var els = opts.els || {};
    var runState = opts.runState;
    var targetSystem = opts.targetSystem;
    var motionSystem = opts.motionSystem;
    var audio = opts.audio;

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

    function isActivated(){
      return !!(els.swingActivatedEnabled && els.swingActivatedEnabled.checked);
    }

    function clamp(value, min, max){
      value = parseFloat(value);
      if(!isFinite(value)) value = min;
      return Math.min(max, Math.max(min, value));
    }

    function colorWithOpacity(color, opacity){
      opacity = clamp(opacity, 0, 1);
      if(/^#[0-9a-f]{6}$/i.test(color || '')){
        var r = parseInt(color.slice(1, 3), 16);
        var g = parseInt(color.slice(3, 5), 16);
        var b = parseInt(color.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
      }
      return color || 'rgba(17,17,17,' + opacity + ')';
    }

    function getHardCoverSpecs(){
      var coverActive = !!(els.swingHardCoverEnabled && els.swingHardCoverEnabled.checked);
      var color = els.swingHardCoverColor ? els.swingHardCoverColor.value : '#111111';
      var opacity = clamp(els.swingHardCoverOpacity ? els.swingHardCoverOpacity.value : 0.9, 0, 1);
      var specs = [
        {
          edge: 'bottom',
          enabled: coverActive && !!(els.swingHardCoverBottomEnabled && els.swingHardCoverBottomEnabled.checked),
          percent: clamp(els.swingHardCoverBottomPercent ? els.swingHardCoverBottomPercent.value : 25, 0, 100)
        },
        {
          edge: 'left',
          enabled: coverActive && !!(els.swingHardCoverLeftEnabled && els.swingHardCoverLeftEnabled.checked),
          percent: clamp(els.swingHardCoverLeftPercent ? els.swingHardCoverLeftPercent.value : 25, 0, 100)
        },
        {
          edge: 'right',
          enabled: coverActive && !!(els.swingHardCoverRightEnabled && els.swingHardCoverRightEnabled.checked),
          percent: clamp(els.swingHardCoverRightPercent ? els.swingHardCoverRightPercent.value : 25, 0, 100)
        }
      ];
      specs.forEach(function(spec){
        spec.color = color;
        spec.opacity = opacity;
      });
      specs.signature = specs.map(function(spec){
        return [spec.enabled ? 1 : 0, spec.edge, spec.percent.toFixed(3)].join(':');
      }).join('|') + '|' + color + '|' + opacity.toFixed(3);
      return specs;
    }

    function renderHardCovers(board, specs){
      if(!board) return;
      specs = specs || getHardCoverSpecs();
      var activeSpecs = specs.filter(function(spec){
        return spec.enabled && spec.percent > 0;
      });
      if(activeSpecs.length === 0) return;
      var svgNs = 'http://www.w3.org/2000/svg';
      var cover = document.createElementNS(svgNs, 'svg');
      var path = document.createElementNS(svgNs, 'path');
      var d = activeSpecs.map(function(spec){
        if(spec.edge === 'left'){
          return 'M0 0 H' + spec.percent + ' V100 H0 Z';
        }
        if(spec.edge === 'right'){
          return 'M' + (100 - spec.percent) + ' 0 H100 V100 H' + (100 - spec.percent) + ' Z';
        }
        return 'M0 ' + (100 - spec.percent) + ' H100 V100 H0 Z';
      }).join(' ');
      cover.classList.add('swinger-hard-cover');
      cover.setAttribute('viewBox', '0 0 100 100');
      cover.setAttribute('preserveAspectRatio', 'none');
      cover.style.left = '0';
      cover.style.top = '0';
      cover.style.width = '100%';
      cover.style.height = '100%';
      path.setAttribute('d', d);
      path.setAttribute('fill-rule', 'nonzero');
      path.setAttribute('fill', colorWithOpacity(activeSpecs[0].color, activeSpecs[0].opacity));
      cover.appendChild(path);
      board.appendChild(cover);
    }

    function getAxisPointSpec(config){
      var metrics = targetSystem.getBoardMetrics();
      var visible = !!(els.swingAxisPointVisible && els.swingAxisPointVisible.checked);
      var color = (els.darkBoard && els.darkBoard.checked) ? '#ffffff' : '#000000';
      return {
        visible: visible,
        x: metrics.width / 2,
        y: metrics.height - config.axisHeight,
        color: color,
        signature: [visible ? 1 : 0, color, config.axisHeight.toFixed(3), metrics.width.toFixed(3), metrics.height.toFixed(3)].join('|')
      };
    }

    function renderAxisPoint(board, spec){
      if(!board || !spec || !spec.visible) return;
      var marker = document.createElement('div');
      marker.className = 'swinger-axis-point';
      marker.style.left = spec.x.toFixed(2) + 'px';
      marker.style.top = spec.y.toFixed(2) + 'px';
      marker.style.backgroundColor = spec.color;
      marker.style.boxShadow = spec.color === '#ffffff' ? '0 0 0 1px rgba(0,0,0,0.5)' : '0 0 0 1px rgba(255,255,255,0.5)';
      board.appendChild(marker);
    }

    function getActivatorSpec(config){
      var metrics = targetSystem.getBoardMetrics();
      var shape = els.swingActivatorShape && els.swingActivatorShape.value ? els.swingActivatorShape.value : 'uspsa';
      var size = Math.max(10, parseFloat(els.swingActivatorSize && els.swingActivatorSize.value) || 220);
      var dims = targetSystem.getTargetDimensions(shape, size);
      var yOffset = parseFloat(els.swingActivatorYOffset && els.swingActivatorYOffset.value) || 0;
      var leftPct = clamp(els.swingActivatorLeftX ? els.swingActivatorLeftX.value : 25, 0, 100);
      var rightPct = clamp(els.swingActivatorRightX ? els.swingActivatorRightX.value : 75, 0, 100);
      var axisY = metrics.height - config.axisHeight;
      var color = (shape === 'circle' || shape === 'square') && els.swingActivatorColor ? els.swingActivatorColor.value : targetSystem.resolveTargetColor(1);
      return {
        enabled: isActivated(),
        shape: shape,
        size: size,
        dims: dims,
        y: axisY + yOffset,
        leftX: metrics.width * leftPct / 100,
        rightX: metrics.width * rightPct / 100,
        color: color,
        signature: [isActivated() ? 1 : 0, shape, color, size.toFixed(3), yOffset.toFixed(3), leftPct.toFixed(3), rightPct.toFixed(3), metrics.width.toFixed(3), metrics.height.toFixed(3)].join('|')
      };
    }

    function renderActivatorTargets(board, spec){
      if(!board || !spec || !spec.enabled) return;
      var left = spec.leftX - spec.dims.width / 2;
      var right = spec.rightX - spec.dims.width / 2;
      var top = spec.y - spec.dims.height / 2;
      targetSystem.createTargetElement(board, '', spec.size, left, top, spec.shape, spec.color, false, 6);
      targetSystem.createTargetElement(board, '', spec.size, right, top, spec.shape, spec.color, false, 6);
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
      var hardCoverSpecs = getHardCoverSpecs();
      var axisPointSpec = getAxisPointSpec(config);
      var activatorSpec = getActivatorSpec(config);
      var pos = getTargetPosition(angleDeg, spec.dims, config);
      var target = targetSystem.createTargetElement(board, 1, spec.size, pos.left, pos.top, spec.shape, spec.color, false);
      target.classList.add('swinger-target');
      positionTarget(target, angleDeg, spec.dims, config);
      renderHardCovers(board, hardCoverSpecs);
      renderActivatorTargets(board, activatorSpec);
      renderAxisPoint(board, axisPointSpec);
      var state = getState();
      if(state){
        state.target = target;
        state.targetDims = spec.dims;
        state.targetSignature = spec.signature;
        state.hardCoverSignature = hardCoverSpecs.signature;
        state.axisPointSignature = axisPointSpec.signature;
        state.activatorSignature = activatorSpec.signature;
      }
      return target;
    }

    function updateTarget(angleDeg){
      var state = getState();
      if(!state) return;
      var spec = getTargetSpec();
      var config = getConfig();
      var hardCoverSpecs = getHardCoverSpecs();
      var axisPointSpec = getAxisPointSpec(config);
      var activatorSpec = getActivatorSpec(config);
      if(!state.target || !state.target.parentNode || state.targetSignature !== spec.signature || state.hardCoverSignature !== hardCoverSpecs.signature || state.axisPointSignature !== axisPointSpec.signature || state.activatorSignature !== activatorSpec.signature){
        renderTarget(angleDeg);
        return;
      }
      state.targetDims = spec.dims;
      positionTarget(state.target, angleDeg, spec.dims, config);
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

    function getStartPhase(){
      return (els.swingActivatedLean && els.swingActivatedLean.value === 'left') ? 2 : 0;
    }

    function readActivatedStartDelay(){
      var min = Math.max(0, parseFloat(els.swingActivatedDelayMin && els.swingActivatedDelayMin.value) || 0);
      var max = Math.max(0, parseFloat(els.swingActivatedDelayMax && els.swingActivatedDelayMax.value) || 0);
      if(max < min){
        var tmp = min;
        min = max;
        max = tmp;
      }
      return min + Math.random() * (max - min);
    }

    function startMotion(){
      var state = getState();
      if(!state) return;
      state.running = true;
      state.lastFrame = 0;
      opts.setStatus('Swinger active');
      setRafId(global.requestAnimationFrame(stepTarget));
    }

    async function start(){
      opts.stopRun(true);
      if(isActivated() && audio){ await audio.ensureAudio(); }
      var runToken = runState.begin('swinger', 'running');
      var phase = isActivated() ? getStartPhase() : 0;
      setState({ running: !isActivated(), lastFrame: 0, phase: phase, target: null, targetDims: null, targetSignature: '', runToken: runToken });
      els.startBtn.disabled = true;
      els.stopBtn.disabled = false;
      els.selectedDelay.textContent = '-';
      opts.setBoardHidden(false);
      opts.setAwaitingReveal(false);
      opts.setStatus(isActivated() ? 'Activated swinger waiting' : 'Swinger active');
      renderTarget(motionSystem.swingerAngleFromPhase(getState().phase));
      if(!isActivated()){
        setRafId(global.requestAnimationFrame(stepTarget));
        return;
      }
      var delay = readActivatedStartDelay();
      var drawTime = Math.max(0, parseFloat(els.swingActivatedDrawTime && els.swingActivatedDrawTime.value) || 0);
      var activatorDelay = Math.max(0, parseFloat(els.swingActivatedDelay && els.swingActivatedDelay.value) || 0);
      var startFreq = Math.max(50, parseFloat(els.startFreq && els.startFreq.value) || 0);
      var startLen = Math.max(0.05, parseFloat(els.startLen && els.startLen.value) || 0.1);
      var cueFreq = Math.max(50, parseFloat(els.stopFreq && els.stopFreq.value) || 0);
      var cueLen = Math.max(0.05, parseFloat(els.stopLen && els.stopLen.value) || 0.1);
      if(els.selectedDelay){ els.selectedDelay.textContent = delay.toFixed(2) + ' s'; }
      if(audio){
        var base = audio.currentTime();
        audio.beepAt(startFreq, startLen, base + delay);
        if(drawTime > 0){ audio.beepAt(cueFreq, cueLen, base + delay + drawTime); }
      }
      if(opts.addTimer){
        opts.addTimer(global.setTimeout(function(){
          var state = getState();
          if(!state || state.runToken !== runToken) return;
          opts.setStatus(drawTime > 0 ? 'Draw' : 'Activator delay');
        }, Math.max(0, delay) * 1000));
        if(drawTime > 0){
          opts.addTimer(global.setTimeout(function(){
            var state = getState();
            if(!state || state.runToken !== runToken) return;
            opts.setStatus('Activator delay');
          }, Math.max(0, delay + drawTime) * 1000));
        }
        opts.addTimer(global.setTimeout(function(){
          var state = getState();
          if(!state || state.runToken !== runToken) return;
          startMotion();
        }, Math.max(0, delay + drawTime + activatorDelay) * 1000));
      }
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
