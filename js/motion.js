/*
 * SPDX-FileCopyrightText: 2026 Alexander Doner
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createMotionSystem(opts){
    opts = opts || {};
    var getSpawnIndex = opts.getSpawnIndex || function(){ return 0; };

    function orderedOffset(maxOffset, size){
      if(maxOffset <= 0){ return 0; }
      var step = Math.max(10, size);
      var positions = [0];
      var offset = step;
      while(offset < maxOffset){
        positions.push(offset);
        offset += step;
      }
      if(positions[positions.length - 1] !== maxOffset){
        positions.push(maxOffset);
      }
      if(positions.length === 1){
        return positions[0];
      }
      var cycleLength = positions.length * 2 - 2;
      var cycleIndex = getSpawnIndex() % cycleLength;
      if(cycleIndex < positions.length){
        return positions[cycleIndex];
      }
      return positions[cycleLength - cycleIndex];
    }

    function orderedLinearOffsetAt(maxOffset, size, index){
      if(maxOffset <= 0){ return 0; }
      var step = Math.max(10, size);
      var positions = [0];
      var offset = step;
      while(offset < maxOffset){
        positions.push(offset);
        offset += step;
      }
      if(positions[positions.length - 1] !== maxOffset){
        positions.push(maxOffset);
      }
      var safeIndex = Math.max(0, index || 0);
      return positions[safeIndex % positions.length];
    }

    function orderedLinearOffset(maxOffset, size){
      return orderedLinearOffsetAt(maxOffset, size, getSpawnIndex());
    }

    function oppositeEdge(edge){
      if(edge === 'left') return 'right';
      if(edge === 'right') return 'left';
      if(edge === 'top') return 'bottom';
      return 'top';
    }

    function borderPointFromOffset(metrics, offset){
      var width = Math.max(0, metrics.width);
      var height = Math.max(0, metrics.height);
      var perimeter = Math.max(1, width * 2 + height * 2);
      var cursor = ((offset % perimeter) + perimeter) % perimeter;

      if(cursor <= width){
        return { cx: cursor, cy: 0 };
      }
      cursor -= width;
      if(cursor <= height){
        return { cx: width, cy: cursor };
      }
      cursor -= height;
      if(cursor <= width){
        return { cx: width - cursor, cy: height };
      }
      cursor -= width;
      return { cx: 0, cy: Math.max(0, height - cursor) };
    }

    function borderSpawnData(metrics, dims, placement, alternateEdge){
      var perimeter = Math.max(1, metrics.width * 2 + metrics.height * 2);
      var spacing = Math.max(dims.width, dims.height);
      var offset = 0;
      var spawnIndex = getSpawnIndex();
      if(placement === 'ordered'){
        if(alternateEdge){
          var pairIndex = Math.floor(spawnIndex / 2);
          var baseOffset = orderedLinearOffsetAt(perimeter, spacing, pairIndex);
          offset = (spawnIndex % 2 === 1) ? (baseOffset + perimeter / 2) : baseOffset;
        } else {
          offset = orderedLinearOffset(perimeter, spacing);
        }
      } else {
        offset = Math.random() * perimeter;
      }
      var point = borderPointFromOffset(metrics, offset);
      var targetCx = metrics.width - point.cx;
      var targetCy = metrics.height - point.cy;
      var dx = targetCx - point.cx;
      var dy = targetCy - point.cy;
      var distance = Math.hypot(dx, dy) || 1;
      return {
        x: point.cx - dims.width / 2,
        y: point.cy - dims.height / 2,
        dirX: dx / distance,
        dirY: dy / distance
      };
    }

    function swingerAngleFromPhase(phase){
      var segment = Math.floor(phase) % 4;
      var u = phase - Math.floor(phase);
      if(segment === 0){ return 90 * (1 - u * u); }
      if(segment === 1){ return -90 * (2 * u - u * u); }
      if(segment === 2){ return -90 * (1 - u * u); }
      return 90 * (2 * u - u * u);
    }

    return {
      orderedOffset: orderedOffset,
      orderedLinearOffsetAt: orderedLinearOffsetAt,
      orderedLinearOffset: orderedLinearOffset,
      oppositeEdge: oppositeEdge,
      borderSpawnData: borderSpawnData,
      swingerAngleFromPhase: swingerAngleFromPhase
    };
  }

  ns.motion = {
    createMotionSystem: createMotionSystem
  };
})(window);
