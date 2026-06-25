(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createTargetSystem(opts){
    opts = opts || {};
    var els = opts.els || {};
    var brightTargetColors = opts.brightTargetColors || [];
    var getCalibration = opts.getCalibration || function(){ return {}; };
    var isContinuousMode = opts.isContinuousMode || function(){ return false; };
    var isSwingerMode = opts.isSwingerMode || function(){ return false; };
    var getContinuousState = opts.getContinuousState || function(){ return null; };
    var getSwingerState = opts.getSwingerState || function(){ return null; };
    var renderSwingerTarget = opts.renderSwingerTarget || function(){};

    function $(id){ return document.getElementById(id); }

    function randBetween(a,b){
      if(b < a){ var tmp = a; a = b; b = tmp; }
      return a + Math.random() * (b - a);
    }

    function shuffle(list){
      for(var i=list.length-1;i>0;i--){
        var j = Math.floor(Math.random() * (i + 1));
        var t = list[i];
        list[i] = list[j];
        list[j] = t;
      }
      return list;
    }

    function getTargetTrueHeightInches(shape){
      if(shape === 'd1' || shape === 'uspsa' || shape === 'metric' || shape === 'no-shoot'){ return 30; }
      if(shape === 'ipsc-mini'){ return 37.5 / 2.54; }
      if(shape === 'bowling-pin'){ return 15; }
      return 0;
    }

    function hasCalibration(){
      var calibration = getCalibration();
      return !!(calibration && calibration.pxPerIn && calibration.pxPerIn > 0);
    }

    function getSelectedTargetShape(){
      if(isClassifierMode()){ return 'metric'; }
      var shape = els.targetShape && els.targetShape.value ? els.targetShape.value : 'circle';
      return shape === 'square' || shape === 'd1' || shape === 'uspsa' || shape === 'metric' || shape === 'no-shoot' || shape === 'ipsc-mini' || shape === 'bowling-pin' ? shape : 'circle';
    }

    function canUseDistanceScale(){
      return hasCalibration() && getTargetTrueHeightInches(getSelectedTargetShape()) > 0;
    }

    function getDistanceScaleSizeFor(shape, targetYd){
      var trueHeightIn = getTargetTrueHeightInches(shape);
      var screenIn = Math.max(0.1, parseFloat(els.screenDistanceFt.value) || 2) * 12;
      var targetIn = Math.max(0.1, parseFloat(targetYd) || 10) * 36;
      var calibration = getCalibration();
      if(!hasCalibration() || !trueHeightIn){ return 0; }
      return Math.max(10, trueHeightIn * (screenIn / targetIn) * calibration.pxPerIn);
    }

    function getDistanceScaleSize(){
      return getDistanceScaleSizeFor(getSelectedTargetShape(), els.targetDistanceYd && els.targetDistanceYd.value);
    }

    function getDistanceScalePercent(){
      var screenIn = Math.max(0.1, parseFloat(els.screenDistanceFt.value) || 2) * 12;
      var targetYd = Math.max(0.1, parseFloat(els.targetDistanceYd.value) || 10);
      return (screenIn / (targetYd * 36)) * 100;
    }

    function getTargetSizeConfig(){
      var distanceScale = canUseDistanceScale() && !!(els.useDistanceScale && els.useDistanceScale.checked);
      var fixedSize = distanceScale ? getDistanceScaleSize() : Math.max(10, parseFloat(els.targetSize.value) || 60);
      var random = !distanceScale && !!(els.randomSizes && els.randomSizes.checked);
      var minSize = Math.max(10, parseFloat(els.targetSizeMin.value) || 40);
      var maxSize = Math.max(10, parseFloat(els.targetSizeMax.value) || 100);
      if(maxSize < minSize){ var swap = minSize; minSize = maxSize; maxSize = swap; }
      return {
        random: random,
        fixedSize: fixedSize,
        minSize: minSize,
        maxSize: maxSize
      };
    }

    function sampleTargetSize(sizeConfig){
      return sizeConfig.random ? randBetween(sizeConfig.minSize, sizeConfig.maxSize) : sizeConfig.fixedSize;
    }

    function getTargetDimensions(shape, size){
      var height = Math.max(10, size);
      var width = shape === 'd1' || shape === 'uspsa' ? height * (18 / 30) : (shape === 'ipsc-mini' ? height * (30 / 37.5) : (shape === 'bowling-pin' ? height * (4.8 / 15) : height));
      return { width: width, height: height };
    }

    function targetHeightForCell(shape, cellW, cellH, fitFactor){
      var availableW = Math.max(10, cellW * fitFactor);
      var availableH = Math.max(10, cellH * fitFactor);
      if(shape === 'd1' || shape === 'uspsa' || shape === 'metric' || shape === 'no-shoot'){ return Math.min(availableH, availableW * (30 / 18)); }
      if(shape === 'ipsc-mini'){ return Math.min(availableH, availableW * (37.5 / 30)); }
      if(shape === 'bowling-pin'){ return Math.min(availableH, availableW * (15 / 4.8)); }
      return Math.min(availableW, availableH);
    }

    function resolveTargetColor(index){
      var shape = getSelectedTargetShape();
      if(shape === 'd1' || shape === 'uspsa' || shape === 'metric' || shape === 'ipsc-mini'){ return '#8a5a35'; }
      if(shape === 'no-shoot'){ return '#ffffff'; }
      if(shape === 'bowling-pin'){ return '#ffffff'; }
      if(els.randomTargetColors && els.randomTargetColors.checked){
        return brightTargetColors[((index || 0) % brightTargetColors.length + brightTargetColors.length) % brightTargetColors.length];
      }
      return els.targetColor && els.targetColor.value ? els.targetColor.value : '#d62828';
    }

    function contrastColor(hex){
      if(!hex){ return '#111'; }
      var h = hex.replace('#','');
      if(h.length === 3){ h = h.split('').map(function(v){ return v + v; }).join(''); }
      if(h.length !== 6){ return '#111'; }
      var r = parseInt(h.slice(0,2), 16);
      var g = parseInt(h.slice(2,4), 16);
      var b = parseInt(h.slice(4,6), 16);
      if([r,g,b].some(function(v){ return isNaN(v); })){ return '#111'; }
      var luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return luminance > 0.55 ? '#111' : '#fff';
    }

    // Target geometry notes: NRA D1, USPSA, and bowling pin dimensions are inch-based; IPSC Mini vertices are centimeter-based.
    function createD1Svg(){
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 18 30');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      var silhouette = document.createElementNS(ns, 'path');
      silhouette.setAttribute('d', 'M0.15 9 A8.85 8.85 0 0 1 17.85 9 L17.85 29.85 L0.15 29.85 Z');
      silhouette.setAttribute('fill', '#8a5a35');
      silhouette.setAttribute('stroke', '#050505');
      silhouette.setAttribute('stroke-width', '0.3');
      svg.appendChild(silhouette);

      [5.8875, 3.8875, 1.8875].forEach(function(radius){
        var ring = document.createElementNS(ns, 'circle');
        ring.setAttribute('cx', '9');
        ring.setAttribute('cy', '15');
        ring.setAttribute('r', String(radius));
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#050505');
        ring.setAttribute('stroke-width', '0.225');
        svg.appendChild(ring);
      });

      return svg;
    }

    function createUSPSASvg(){
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 18 30');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      var outline = document.createElementNS(ns, 'path');
      outline.setAttribute('d', 'M6 0 L12 0 L12 6 L16 6 L18 8 L18 24 L15 30 L3 30 L0 24 L0 8 L2 6 L6 6 Z');
      outline.setAttribute('fill', '#050505');
      svg.appendChild(outline);

      var silhouette = document.createElementNS(ns, 'path');
      silhouette.setAttribute('d', 'M6.3 0.3 L11.7 0.3 L11.7 6.3 L15.7 6.3 L17.7 8.3 L17.7 23.93 L14.7 29.7 L3.3 29.7 L0.3 23.93 L0.3 8.3 L2.3 6.3 L6.3 6.3 Z');
      silhouette.setAttribute('fill', '#8a5a35');
      svg.appendChild(silhouette);

      var cZone = document.createElementNS(ns, 'path');
      cZone.setAttribute('d', 'M6.1125 6.1125 L11.8875 6.1125 L14.8875 8.1125 L14.8875 18.8875 L12.8875 23.8875 L5.1125 23.8875 L3.1125 18.8875 L3.1125 8.1125 Z');
      cZone.setAttribute('fill', 'none');
      cZone.setAttribute('stroke', '#050505');
      cZone.setAttribute('stroke-width', '0.225');
      svg.appendChild(cZone);

      var upperA = document.createElementNS(ns, 'path');
      upperA.setAttribute('d', 'M7.1125 1.1125 L10.8875 1.1125 L10.8875 2.8875 L7.1125 2.8875 Z');
      upperA.setAttribute('fill', 'none');
      upperA.setAttribute('stroke', '#050505');
      upperA.setAttribute('stroke-width', '0.225');
      svg.appendChild(upperA);

      var lowerA = document.createElementNS(ns, 'rect');
      lowerA.setAttribute('x', '6.1125');
      lowerA.setAttribute('y', '8.1125');
      lowerA.setAttribute('width', '5.775');
      lowerA.setAttribute('height', '10.775');
      lowerA.setAttribute('fill', 'none');
      lowerA.setAttribute('stroke', '#050505');
      lowerA.setAttribute('stroke-width', '0.225');
      svg.appendChild(lowerA);

      return svg;
    }

    function createMetricNoShootSvg(){
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 18 30');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      var outline = document.createElementNS(ns, 'path');
      outline.setAttribute('d', 'M6 0 L12 0 L12 6 L16 6 L18 8 L18 24 L15 30 L3 30 L0 24 L0 8 L2 6 L6 6 Z');
      outline.setAttribute('fill', '#ffffff');
      outline.setAttribute('stroke', '#111111');
      outline.setAttribute('stroke-width', '0.35');
      svg.appendChild(outline);

      return svg;
    }

    function createIPSCMiniSvg(){
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 30 37.5');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      var outline = document.createElementNS(ns, 'polygon');
      outline.setAttribute('points', '10,0 20,0 30,12.5 30,25 20,37.5 10,37.5 0,25 0,12.5');
      outline.setAttribute('fill', '#050505');
      svg.appendChild(outline);

      var silhouette = document.createElementNS(ns, 'polygon');
      silhouette.setAttribute('points', '10.35,0.35 19.65,0.35 29.65,12.62 29.65,24.88 19.65,37.15 10.35,37.15 0.35,24.88 0.35,12.62');
      silhouette.setAttribute('fill', '#8a5a35');
      svg.appendChild(silhouette);

      var cZone = document.createElementNS(ns, 'polygon');
      cZone.setAttribute('points', '10,0 20,0 25,12.5 25,22 18.5,30 11.5,30 5,22 5,12.5');
      cZone.setAttribute('fill', 'none');
      cZone.setAttribute('stroke', '#050505');
      cZone.setAttribute('stroke-width', '0.375');
      svg.appendChild(cZone);

      var aZone = document.createElementNS(ns, 'polygon');
      aZone.setAttribute('points', '13,1.5 17,1.5 20,12.5 20,18 17,23 13,23 10,18 10,12.5');
      aZone.setAttribute('fill', 'none');
      aZone.setAttribute('stroke', '#050505');
      aZone.setAttribute('stroke-width', '0.375');
      svg.appendChild(aZone);

      return svg;
    }

    function createBowlingPinSvg(){
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 4.8 15');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      var outline = document.createElementNS(ns, 'path');
      outline.setAttribute('d', 'M3.3477 14.9958 c0.0459 0.0002 0.0917 -0.0202 0.1219 -0.0541 c0.0073 -0.0081 0.0138 -0.0170 0.0194 -0.0265 c0.0527 -0.0999 0.1203 -0.2342 0.1699 -0.3358 c0.2474 -0.5075 0.4639 -1.0378 0.6376 -1.5746 c0.2322 -0.7225 0.3986 -1.4724 0.4587 -2.2290 c0.0447 -0.5756 0.0187 -1.1619 -0.1049 -1.7268 c-0.0922 -0.4250 -0.2397 -0.8435 -0.4056 -1.2453 c-0.2153 -0.5259 -0.5517 -1.1951 -0.7359 -1.7319 c-0.1042 -0.3030 -0.1805 -0.6195 -0.2046 -0.9393 c-0.0384 -0.5175 0.0321 -1.0413 0.1215 -1.5505 c0.0880 -0.4864 0.2708 -1.2735 0.2972 -1.7582 c0.0159 -0.2638 -0.0014 -0.5317 -0.0571 -0.7903 c-0.0428 -0.1992 -0.1056 -0.3990 -0.2207 -0.5693 c-0.2387 -0.3555 -0.6348 -0.4641 -1.0453 -0.4636 c-0.4105 -0.0005 -0.8066 0.1081 -1.0453 0.4636 c-0.1152 0.1703 -0.1779 0.3702 -0.2207 0.5693 c-0.0557 0.2586 -0.0730 0.5266 -0.0571 0.7903 c0.0257 0.4820 0.2106 1.2769 0.2972 1.7582 c0.0967 0.5528 0.1730 1.1226 0.1086 1.6831 c-0.0349 0.2968 -0.1138 0.5898 -0.2142 0.8712 c-0.1807 0.5078 -0.5088 1.1673 -0.7134 1.6673 c-0.1659 0.4020 -0.3136 0.8203 -0.4056 1.2453 c-0.1236 0.5649 -0.1496 1.1512 -0.1049 1.7268 c0.0325 0.4208 0.1013 0.8447 0.1931 1.2567 c0.1365 0.6119 0.3303 1.2161 0.5673 1.7965 c0.1329 0.3253 0.2853 0.6560 0.4452 0.9690 c0.0000 0.0000 0.0569 0.1101 0.0569 0.1101 s0.0012 0.0023 0.0012 0.0023 s0.0014 0.0023 0.0014 0.0023 s0.0014 0.0023 0.0014 0.0023 c0.0054 0.0093 0.0122 0.0184 0.0194 0.0265 c0.0147 0.0167 0.0349 0.0309 0.0548 0.0397 c0.0129 0.0056 0.0264 0.0100 0.0403 0.0121 c0.0061 0.0009 0.0126 0.0019 0.0190 0.0021 C1.4523 15.0000 3.3393 14.9930 3.3477 14.9958 z');
      outline.setAttribute('fill', '#050505');
      svg.appendChild(outline);

      var pin = document.createElementNS(ns, 'path');
      pin.setAttribute('d', 'M3.3477 14.9958 c0.0459 0.0002 0.0917 -0.0202 0.1219 -0.0541 c0.0073 -0.0081 0.0138 -0.0170 0.0194 -0.0265 c0.0527 -0.0999 0.1203 -0.2342 0.1699 -0.3358 c0.2474 -0.5075 0.4639 -1.0378 0.6376 -1.5746 c0.2322 -0.7225 0.3986 -1.4724 0.4587 -2.2290 c0.0447 -0.5756 0.0187 -1.1619 -0.1049 -1.7268 c-0.0922 -0.4250 -0.2397 -0.8435 -0.4056 -1.2453 c-0.2153 -0.5259 -0.5517 -1.1951 -0.7359 -1.7319 c-0.1042 -0.3030 -0.1805 -0.6195 -0.2046 -0.9393 c-0.0384 -0.5175 0.0321 -1.0413 0.1215 -1.5505 c0.0880 -0.4864 0.2708 -1.2735 0.2972 -1.7582 c0.0159 -0.2638 -0.0014 -0.5317 -0.0571 -0.7903 c-0.0428 -0.1992 -0.1056 -0.3990 -0.2207 -0.5693 c-0.2387 -0.3555 -0.6348 -0.4641 -1.0453 -0.4636 c-0.4105 -0.0005 -0.8066 0.1081 -1.0453 0.4636 c-0.1152 0.1703 -0.1779 0.3702 -0.2207 0.5693 c-0.0557 0.2586 -0.0730 0.5266 -0.0571 0.7903 c0.0257 0.4820 0.2106 1.2769 0.2972 1.7582 c0.0967 0.5528 0.1730 1.1226 0.1086 1.6831 c-0.0349 0.2968 -0.1138 0.5898 -0.2142 0.8712 c-0.1807 0.5078 -0.5088 1.1673 -0.7134 1.6673 c-0.1659 0.4020 -0.3136 0.8203 -0.4056 1.2453 c-0.1236 0.5649 -0.1496 1.1512 -0.1049 1.7268 c0.0325 0.4208 0.1013 0.8447 0.1931 1.2567 c0.1365 0.6119 0.3303 1.2161 0.5673 1.7965 c0.1329 0.3253 0.2853 0.6560 0.4452 0.9690 c0.0000 0.0000 0.0569 0.1101 0.0569 0.1101 s0.0012 0.0023 0.0012 0.0023 s0.0014 0.0023 0.0014 0.0023 s0.0014 0.0023 0.0014 0.0023 c0.0054 0.0093 0.0122 0.0184 0.0194 0.0265 c0.0147 0.0167 0.0349 0.0309 0.0548 0.0397 c0.0129 0.0056 0.0264 0.0100 0.0403 0.0121 c0.0061 0.0009 0.0126 0.0019 0.0190 0.0021 C1.4523 15.0000 3.3393 14.9930 3.3477 14.9958 z');
      pin.setAttribute('fill', '#ffffff');
      pin.setAttribute('transform', 'translate(2.4 7.5) scale(0.93 0.98) translate(-2.4 -7.5)');
      svg.appendChild(pin);

      return svg;
    }

    function createHardCoverSvg(orientation){
      if(orientation !== 'lower-left' && orientation !== 'lower-right'){ return null; }
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 18 30');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.style.position = 'absolute';
      svg.style.inset = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.zIndex = '1';
      svg.style.pointerEvents = 'none';

      var cover = document.createElementNS(ns, 'polygon');
      cover.setAttribute('points', orientation === 'lower-left' ? '0,30 0,9 18,30' : '18,30 18,9 0,30');
      cover.setAttribute('fill', '#050505');
      svg.appendChild(cover);

      return svg;
    }

    function createTargetElement(board, label, size, left, top, shape, color, numbered, zIndex, hardCover){
      var target = document.createElement('div');
      var dims = getTargetDimensions(shape, size);
      target.className = 'target ' + shape;
      target.style.width = dims.width.toFixed(2) + 'px';
      target.style.height = dims.height.toFixed(2) + 'px';
      target.style.left = left.toFixed(2) + 'px';
      target.style.top = top.toFixed(2) + 'px';
      if(zIndex != null){ target.style.zIndex = String(zIndex); }
      if(shape === 'd1'){
        target.appendChild(createD1Svg());
        target.style.color = '#fff';
      } else if(shape === 'uspsa' || shape === 'metric'){
        target.appendChild(createUSPSASvg());
        target.style.color = '#fff';
      } else if(shape === 'ipsc-mini'){
        target.appendChild(createIPSCMiniSvg());
        target.style.color = '#fff';
      } else if(shape === 'no-shoot'){
        target.appendChild(createMetricNoShootSvg());
        target.style.color = '#111';
      } else if(shape === 'bowling-pin'){
        target.appendChild(createBowlingPinSvg());
        target.style.color = '#111';
      } else {
        target.style.backgroundColor = color;
        target.style.color = contrastColor(color);
      }
      var fontSize = Math.max(12, size * 0.32);
      target.style.fontSize = fontSize.toFixed(2) + 'px';
      var hardCoverSvg = createHardCoverSvg(hardCover);
      if(hardCoverSvg){ target.appendChild(hardCoverSvg); }
      if(numbered){
        var span = document.createElement('span');
        span.textContent = String(label);
        if(hardCoverSvg){ span.style.zIndex = '2'; }
        target.appendChild(span);
      }
      board.appendChild(target);
      return target;
    }

    function getBoardMetrics(){
      var board = els.targetBoard;
      var rect = board.getBoundingClientRect();
      var width = rect.width || global.innerWidth || 800;
      var height = rect.height || global.innerHeight || 600;
      return { width: width, height: height };
    }

    function isClassifierMode(){
      return !!(els.sessionMode && els.sessionMode.value === 'classifier');
    }

    function getSelectedClassifierId(){
      return els.classifierSelect && els.classifierSelect.value ? els.classifierSelect.value : (ns.classifiers && ns.classifiers.getDefaultClassifierId ? ns.classifiers.getDefaultClassifierId() : '');
    }

    function getSelectedClassifier(){
      if(!ns.classifiers || !ns.classifiers.getClassifierById){ return null; }
      return ns.classifiers.getClassifierById(getSelectedClassifierId());
    }

    function getClassifierCenterPct(){
      var value = parseFloat(els.classifierCenterPct && els.classifierCenterPct.value);
      if(!isFinite(value)){ value = 28; }
      return Math.min(100, Math.max(0, value));
    }

    function overlapPenalty(left, top, dims, placements){
      var penalty = 0;
      var r = Math.max(dims.width, dims.height) / 2;
      var cx = left + dims.width / 2;
      var cy = top + dims.height / 2;
      for(var i=0;i<placements.length;i++){
        var other = placements[i];
        var or = Math.max(other.width, other.height) / 2;
        var ocx = other.left + other.width / 2;
        var ocy = other.top + other.height / 2;
        var dist = Math.hypot(cx - ocx, cy - ocy);
        var minDist = r + or;
        if(dist < minDist){ penalty += (minDist - dist); }
      }
      return penalty;
    }

    function renderGridTargets(board, count, shape, numbered, random, fixedSize, minSize, maxSize, boardW, boardH, labels){
      var distanceScale = canUseDistanceScale() && !!(els.useDistanceScale && els.useDistanceScale.checked);
      var resolvedGrid = resolveGridDimensions(count);
      var cols = resolvedGrid.cols;
      var rows = resolvedGrid.rows;
      var cellW = boardW / cols;
      var cellH = boardH / rows;
      var spread = getGridSpread();
      var physicalSpacing = getGridPhysicalSpacingPx();
      var boardCenterX = boardW / 2;
      var boardCenterY = boardH / 2;
      var fitFactor = 0.82;
      for(var i=0;i<count;i++){
        var sizeCandidate = random ? randBetween(minSize, maxSize) : fixedSize;
        var maxFit = Math.max(10, targetHeightForCell(shape, cellW, cellH, fitFactor));
        var size = distanceScale ? Math.max(10, sizeCandidate) : Math.max(10, Math.min(sizeCandidate, maxFit));
        var dims = getTargetDimensions(shape, size);
        var row = Math.floor(i / cols);
        var col = i % cols;
        var centerX = col * cellW + cellW / 2;
        var centerY = row * cellH + cellH / 2;
        if(physicalSpacing > 0){
          centerX = boardCenterX + (col - (cols - 1) / 2) * physicalSpacing;
          centerY = boardCenterY + (row - (rows - 1) / 2) * physicalSpacing;
        } else {
          centerX = boardCenterX + (centerX - boardCenterX) * spread;
          centerY = boardCenterY + (centerY - boardCenterY) * spread;
        }
        var left = centerX - dims.width / 2;
        var top = centerY - dims.height / 2;
        left = Math.min(Math.max(0, left), Math.max(0, boardW - dims.width));
        top = Math.min(Math.max(0, top), Math.max(0, boardH - dims.height));
        var label = labels && labels[i] != null ? labels[i] : (i + 1);
        createTargetElement(board, label, size, left, top, shape, resolveTargetColor(i), numbered);
      }
    }

    function renderClassifierTargets(board, boardW, boardH){
      var classifier = getSelectedClassifier();
      if(!classifier){ return; }
      var numbered = !!(els.targetNumbered && els.targetNumbered.checked);
      var sizeConfig = getTargetSizeConfig();
      var baseShape = classifier.targetShape || 'metric';
      var baseSize = Math.max(10, sizeConfig.fixedSize);
      var baseDims = getTargetDimensions(baseShape, baseSize);
      var distanceScale = canUseDistanceScale() && !!(els.useDistanceScale && els.useDistanceScale.checked);
      var spanTargetWidths = Math.max(1, parseFloat(classifier.layoutSpanTargetWidths) || 1);
      var usableWidth = Math.max(baseDims.width, baseDims.width * spanTargetWidths);
      var totalSpan = Math.max(0, usableWidth - baseDims.width);
      var leftMargin = (boardW - usableWidth) / 2;
      var baseCenterY = boardH * getClassifierCenterPct() / 100;
      var count = Math.min(classifier.positions.length, classifier.labels.length);

      var placements = [];
      for(var i=0;i<count;i++){
        var norm = classifier.positions[i];
        var label = classifier.labels[i] || '';
        var kind = classifier.kinds[i] || 'target';
        var shape = kind === 'no-shoot' ? 'no-shoot' : baseShape;
        var targetYd = classifier.distancesYd && classifier.distancesYd[i] ? classifier.distancesYd[i] : 0;
        var itemSize = distanceScale && targetYd ? getDistanceScaleSizeFor(shape, targetYd) : baseSize;
        var dims = getTargetDimensions(shape, itemSize);
        var centerX = leftMargin + baseDims.width / 2 + norm * totalSpan;
        placements.push({
          index: i,
          norm: norm,
          label: label,
          kind: kind,
          shape: shape,
          size: itemSize,
          top: baseCenterY - dims.height / 2,
          hardCover: classifier.hardCover && classifier.hardCover[i] ? classifier.hardCover[i] : '',
          left: centerX - dims.width / 2
        });
      }

      placements.filter(function(item){ return item.kind === 'target'; }).forEach(function(item){
        createTargetElement(board, item.label, item.size, item.left, item.top, item.shape, resolveTargetColor(item.index), numbered, 1, item.hardCover);
      });

      placements.filter(function(item){ return item.kind !== 'target'; }).forEach(function(item){
        createTargetElement(board, item.label, item.size, item.left, item.top, item.shape, resolveTargetColor(item.index), false, 2);
      });
    }

    function renderTargets(){
      toggleSizeInputs();
      var board = els.targetBoard;
      if(!board) return;
      board.innerHTML = '';
      if(isClassifierMode()){
        var classifierMetrics = getBoardMetrics();
        renderClassifierTargets(board, classifierMetrics.width, classifierMetrics.height);
        return;
      }
      if(isContinuousMode()){
        var continuousState = getContinuousState();
        if(continuousState){ continuousState.targets = []; }
        return;
      }
      if(isSwingerMode()){
        if(!getSwingerState()){ renderSwingerTarget(90); }
        return;
      }
      var count = Math.max(0, Math.floor(parseFloat(els.targetCount.value) || 0));
      if(count === 0){ return; }
      var shape = getSelectedTargetShape();
      var numbered = !!(els.targetNumbered && els.targetNumbered.checked);
      var sizeConfig = getTargetSizeConfig();
      var random = sizeConfig.random;
      var fixedSize = sizeConfig.fixedSize;
      var minSize = sizeConfig.minSize;
      var maxSize = sizeConfig.maxSize;
      var arrangement = els.targetLayout ? els.targetLayout.value : 'random';
      syncGridLimits(count);
      var labels = [];
      for(var n=1;n<=count;n++){ labels.push(n); }
      var gridLabels = arrangement === 'grid' ? shuffle(labels.slice()) : labels;
      var rect = board.getBoundingClientRect();
      var boardW = rect.width;
      var boardH = rect.height;
      if(!boardW || !boardH){
        var parentRect = board.parentElement ? board.parentElement.getBoundingClientRect() : null;
        if(parentRect && parentRect.width){ boardW = parentRect.width; boardH = parentRect.height || boardH; }
        if(!boardW || !boardH){ boardW = global.innerWidth || 800; boardH = global.innerHeight || 600; }
      }
      if(arrangement === 'grid'){
        renderGridTargets(board, count, shape, numbered, random, fixedSize, minSize, maxSize, boardW, boardH, gridLabels);
        return;
      }
      var placements = [];
      var attemptBase = count <= 10 ? 28 : (count <= 25 ? 20 : 14);
      for(var i=0;i<count;i++){
        var size = random ? randBetween(minSize, maxSize) : fixedSize;
        size = Math.max(10, size);
        var dims = getTargetDimensions(shape, size);
        var best = null;
        var attempts = attemptBase;
        for(var attempt=0; attempt<attempts; attempt++){
          var left = Math.random() * Math.max(0, boardW - dims.width);
          var top = Math.random() * Math.max(0, boardH - dims.height);
          left = Math.min(Math.max(0, left), Math.max(0, boardW - dims.width));
          top = Math.min(Math.max(0, top), Math.max(0, boardH - dims.height));
          var penalty = overlapPenalty(left, top, dims, placements);
          if(!best || penalty < best.penalty){ best = { left:left, top:top, penalty:penalty }; }
          if(penalty === 0){ break; }
        }
        if(!best){ best = { left:0, top:0, penalty:0 }; }
        placements.push({ left:best.left, top:best.top, width:dims.width, height:dims.height });
        createTargetElement(board, labels[i], size, best.left, best.top, shape, resolveTargetColor(i), numbered);
      }
    }

    function isGridLayoutActive(){
      return !isContinuousMode() && !isClassifierMode() && !!(els.targetLayout && els.targetLayout.value === 'grid');
    }

    function syncGridLimits(count){
      count = Math.max(1, Math.floor(count || parseFloat(els.targetCount.value) || 1));
      ['gridRows','gridCols'].forEach(function(id){
        var input = els[id];
        if(!input) return;
        input.max = String(count);
        var value = Math.floor(parseFloat(input.value) || 0);
        if(value > count){ input.value = String(count); }
      });
    }

    function getGridConfig(count){
      syncGridLimits(count);
      function readGridValue(input){
        if(!input) return 0;
        var value = Math.floor(parseFloat(input.value) || 0);
        if(value < 1) return 0;
        return Math.min(value, Math.max(1, count));
      }
      return {
        rows: readGridValue(els.gridRows),
        cols: readGridValue(els.gridCols)
      };
    }

    function resolveGridDimensions(count){
      count = Math.max(1, Math.floor(count || parseFloat(els.targetCount.value) || 1));
      var aspect = 1;
      var board = els.targetBoard;
      if(board){
        var rect = board.getBoundingClientRect();
        if(rect && rect.width && rect.height){ aspect = rect.width / rect.height; }
      }
      var requestedGrid = getGridConfig(count);
      var cols = requestedGrid.cols || Math.max(1, Math.ceil(Math.sqrt(count * (aspect || 1))));
      var rows = requestedGrid.rows || Math.max(1, Math.ceil(count / cols));
      if(requestedGrid.rows && !requestedGrid.cols){ cols = Math.max(1, Math.ceil(count / rows)); }
      if(requestedGrid.cols && !requestedGrid.rows){ rows = Math.max(1, Math.ceil(count / cols)); }
      if(rows * cols < count){
        if(requestedGrid.rows && !requestedGrid.cols){ cols = Math.ceil(count / rows); }
        else if(requestedGrid.cols && !requestedGrid.rows){ rows = Math.ceil(count / cols); }
        else if(rows <= cols){ rows = Math.ceil(count / cols); }
        else { cols = Math.ceil(count / rows); }
      }
      return { rows: rows, cols: cols, requestedRows: requestedGrid.rows, requestedCols: requestedGrid.cols };
    }

    function updateGridOverrideState(count){
      count = Math.max(1, Math.floor(count || parseFloat(els.targetCount.value) || 1));
      if(!isGridLayoutActive()){
        if(els.gridRows){ els.gridRows.classList.remove('grid-overridden'); }
        if(els.gridCols){ els.gridCols.classList.remove('grid-overridden'); }
        if(els.gridRowsLabel){ els.gridRowsLabel.classList.remove('grid-overridden'); }
        if(els.gridColsLabel){ els.gridColsLabel.classList.remove('grid-overridden'); }
        return;
      }
      var resolved = resolveGridDimensions(count);
      if(els.gridRows){
        els.gridRows.classList.toggle('grid-overridden', resolved.requestedRows > 0 && resolved.rows !== resolved.requestedRows);
        if(els.gridRowsLabel){ els.gridRowsLabel.classList.toggle('grid-overridden', resolved.requestedRows > 0 && resolved.rows !== resolved.requestedRows); }
      }
      if(els.gridCols){
        els.gridCols.classList.toggle('grid-overridden', resolved.requestedCols > 0 && resolved.cols !== resolved.requestedCols);
        if(els.gridColsLabel){ els.gridColsLabel.classList.toggle('grid-overridden', resolved.requestedCols > 0 && resolved.cols !== resolved.requestedCols); }
      }
    }

    function getGridSpread(){
      var value = parseFloat(els.gridSpread && els.gridSpread.value);
      if(!isFinite(value)){ value = 100; }
      return Math.min(200, Math.max(25, value)) / 100;
    }

    function projectedFeetToPx(feet){
      feet = Math.max(0, parseFloat(feet) || 0);
      var screenFt = Math.max(0.1, parseFloat(els.screenDistanceFt.value) || 2);
      var targetYd = Math.max(0.1, parseFloat(els.targetDistanceYd.value) || 10);
      var projectedScreenFt = feet * (screenFt / (targetYd * 3));
      var calibration = getCalibration();
      return projectedScreenFt * 12 * calibration.pxPerIn;
    }

    function getGridPhysicalSpacingPx(){
      var distanceActive = canUseDistanceScale() && !!(els.useDistanceScale && els.useDistanceScale.checked);
      if(!distanceActive || !(els.useGridPhysicalSpacing && els.useGridPhysicalSpacing.checked)){
        return 0;
      }
      var feet = parseFloat(els.gridSpacingFt && els.gridSpacingFt.value);
      if(!isFinite(feet)){ feet = 2; }
      feet = Math.min(50, Math.max(0.1, feet));
      return projectedFeetToPx(feet);
    }

    function canUseSwingPhysicalDimensions(){
      return canUseDistanceScale() && !!(els.useDistanceScale && els.useDistanceScale.checked) && !!(els.useSwingPhysicalDimensions && els.useSwingPhysicalDimensions.checked);
    }

    function toggleGridInputs(){
      var active = isGridLayoutActive();
      var gridOptions = $('gridOptions');
      if(gridOptions){ gridOptions.hidden = !active; }
      var physicalAvailable = active && canUseDistanceScale() && !!(els.useDistanceScale && els.useDistanceScale.checked);
      var physicalActive = physicalAvailable && !!(els.useGridPhysicalSpacing && els.useGridPhysicalSpacing.checked);
      if(els.useGridPhysicalSpacingBtn){ els.useGridPhysicalSpacingBtn.hidden = !physicalAvailable; }
      if(els.gridSpacingFtLabel){ els.gridSpacingFtLabel.hidden = !physicalActive; }
      if(els.gridSpread){ els.gridSpread.disabled = physicalActive; }
      if(els.useGridPhysicalSpacing && !physicalAvailable){ els.useGridPhysicalSpacing.checked = false; }
      syncGridLimits(parseInt(els.targetCount.value, 10) || 1);
      updateGridOverrideState(parseInt(els.targetCount.value, 10) || 1);
    }

    function toggleSwingInputs(){
      var available = isSwingerMode() && canUseDistanceScale() && !!(els.useDistanceScale && els.useDistanceScale.checked);
      var active = available && !!(els.useSwingPhysicalDimensions && els.useSwingPhysicalDimensions.checked);
      if(els.useSwingPhysicalDimensionsBtn){ els.useSwingPhysicalDimensionsBtn.hidden = !available; }
      if(els.swingTargetHeightFtLabel){ els.swingTargetHeightFtLabel.hidden = !active; }
      if(els.swingAxisHeightFtLabel){ els.swingAxisHeightFtLabel.hidden = !active; }
      if(els.swingTargetHeight){ els.swingTargetHeight.disabled = active; }
      if(els.swingAxisHeight){ els.swingAxisHeight.disabled = active; }
      if(els.useSwingPhysicalDimensions && !available){ els.useSwingPhysicalDimensions.checked = false; }
    }

    function updateDistanceScaleSummary(distanceAvailable, distanceActive){
      if(!els.distanceScaleSummary) return;
      if(!distanceAvailable){
        els.distanceScaleSummary.textContent = '';
        return;
      }
      if(!distanceActive){
        els.distanceScaleSummary.textContent = '';
        return;
      }
      var size = getDistanceScaleSize();
      var percent = getDistanceScalePercent();
      els.distanceScaleSummary.textContent = size.toFixed(0) + ' px tall, ' + percent.toFixed(1) + '% true size';
    }

    function toggleSizeInputs(){
      var distanceAvailable = canUseDistanceScale();
      var distanceActive = distanceAvailable && !!(els.useDistanceScale && els.useDistanceScale.checked);
      var random = !distanceActive && !!(els.randomSizes && els.randomSizes.checked);
      var classifierMode = isClassifierMode();
      var randomSizingApplies = !isSwingerMode() && !classifierMode;
      var fixedOptions = $('fixedSizeOptions');
      var randomOptions = $('randomSizeOptions');
      if(els.distanceScaleOptions){ els.distanceScaleOptions.hidden = !distanceAvailable; }
      if(els.useDistanceScaleBtn){ els.useDistanceScaleBtn.hidden = !distanceAvailable; }
      if(els.screenDistanceLabel){ els.screenDistanceLabel.hidden = !distanceActive; }
      if(els.targetDistanceLabel){ els.targetDistanceLabel.hidden = !distanceActive; }
      if(els.randomSizesBtn){ els.randomSizesBtn.hidden = isSwingerMode() || classifierMode || distanceActive; }
      if(fixedOptions){ fixedOptions.hidden = classifierMode ? distanceActive : (distanceActive || (randomSizingApplies && random)); }
      if(randomOptions){ randomOptions.hidden = classifierMode || distanceActive || !randomSizingApplies || !random; }
      updateDistanceScaleSummary(distanceAvailable, distanceActive);
      toggleGridInputs();
      toggleSwingInputs();
    }

    return {
      randBetween: randBetween,
      hasCalibration: hasCalibration,
      canUseDistanceScale: canUseDistanceScale,
      getTargetSizeConfig: getTargetSizeConfig,
      sampleTargetSize: sampleTargetSize,
      renderTargets: renderTargets,
      getSelectedTargetShape: getSelectedTargetShape,
      getTargetDimensions: getTargetDimensions,
      resolveTargetColor: resolveTargetColor,
      createTargetElement: createTargetElement,
      getBoardMetrics: getBoardMetrics,
      projectedFeetToPx: projectedFeetToPx,
      canUseSwingPhysicalDimensions: canUseSwingPhysicalDimensions,
      toggleGridInputs: toggleGridInputs,
      toggleSwingInputs: toggleSwingInputs,
      toggleSizeInputs: toggleSizeInputs
    };
  }

  ns.targets = {
    createTargetSystem: createTargetSystem
  };
})(window);
