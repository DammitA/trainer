(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function bindInputEvents(input, handler){
    if(!input) return;
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  }

  function createUiBindings(opts){
    opts = opts || {};
    var els = opts.els || {};
    var root = opts.root || document.body;

    function $(id){ return opts.getElement ? opts.getElement(id) : document.getElementById(id); }

    function bindToggleButton(button, input){
      if(!button || !input) return;
      button.addEventListener('click', function(){
        if(input.disabled) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        opts.syncAllToggleButtons();
      });
    }

    function bind(){
      els.startBtn.addEventListener('click', function(){ opts.startRun(); });
      els.stopBtn.addEventListener('click', function(){ opts.stopRun(false); });
      els.testStart.addEventListener('click', async function(){ await opts.testStartBeep(); });
      els.testStop.addEventListener('click', async function(){ await opts.testStopBeep(); });

      ['timerMode','delayMin','delayMax','workDuration','repeats','reloadTime','shotCount','shotSplit','firstShotTime','shotReloads'].forEach(function(id){
        bindInputEvents($(id), function(){ opts.updateModeUI(); opts.persist(); });
      });
      ['startFreq','startLen','stopFreq','stopLen'].forEach(function(id){
        bindInputEvents($(id), function(){ opts.persistBeepSettings(); });
      });

      if(els.sessionMode){
        els.sessionMode.addEventListener('change', function(){
          opts.stopRun(true);
          if(opts.isClassifierMode && opts.isClassifierMode() && els.useDistanceScale && !els.useDistanceScale.checked){
            els.useDistanceScale.checked = true;
          }
          opts.updateModeUI();
          opts.renderTargets();
          opts.persist();
        });
      }

      ['targetCount','targetShape','targetColor','targetSize','targetSizeMin','targetSizeMax','useDistanceScale','screenDistanceFt','targetDistanceYd','targetLayout','gridRows','gridCols','gridSpread','useGridPhysicalSpacing','gridSpacingFt','classifierSelect','classifierCenterPct'].forEach(function(id){
        bindInputEvents($(id), function(){ opts.updateModeUI(); opts.renderTargets(); opts.persist(); });
      });
      ['flowStopMode','flowStopSeconds','flowStopTargets'].forEach(function(id){
        bindInputEvents($(id), function(){ opts.updateModeUI(); opts.persist(); });
      });

      els.targetNumbered.addEventListener('change', function(){ opts.renderTargets(); opts.persist(); });
      if(els.randomTargetColors){
        els.randomTargetColors.addEventListener('change', function(){ opts.updateModeUI(); opts.renderTargets(); opts.persist(); });
      }
      if(els.darkBoard){
        els.darkBoard.addEventListener('change', function(){ opts.updateBoardTheme(); opts.persist(); });
      }
      els.randomSizes.addEventListener('change', function(){ opts.toggleSizeInputs(); opts.renderTargets(); opts.persist(); });

      bindToggleButton(els.targetNumberedBtn, els.targetNumbered);
      bindToggleButton(els.randomTargetColorsBtn, els.randomTargetColors);
      bindToggleButton(els.darkBoardBtn, els.darkBoard);
      bindToggleButton(els.randomSizesBtn, els.randomSizes);
      bindToggleButton(els.hideTargetsBtn, els.hideTargets);
      bindToggleButton(els.useDistanceScaleBtn, els.useDistanceScale);
      bindToggleButton(els.useGridPhysicalSpacingBtn, els.useGridPhysicalSpacing);
      bindToggleButton(els.flowAlternateBtn, els.flowAlternate);
      bindToggleButton(els.flowBypassStopwatchBtn, els.flowBypassStopwatch);
      bindToggleButton(els.useSwingPhysicalDimensionsBtn, els.useSwingPhysicalDimensions);
      bindToggleButton(els.swingAxisPointVisibleBtn, els.swingAxisPointVisible);
      bindToggleButton(els.swingActivatedEnabledBtn, els.swingActivatedEnabled);
      bindToggleButton(els.swingHardCoverEnabledBtn, els.swingHardCoverEnabled);
      bindToggleButton(els.swingHardCoverBottomEnabledBtn, els.swingHardCoverBottomEnabled);
      bindToggleButton(els.swingHardCoverLeftEnabledBtn, els.swingHardCoverLeftEnabled);
      bindToggleButton(els.swingHardCoverRightEnabledBtn, els.swingHardCoverRightEnabled);
      opts.bindPanelToggles();

      ['flowEdge','flowPlacement','flowSpeed','flowRate','swingRate','swingTargetHeight','swingAxisHeight','useSwingPhysicalDimensions','swingTargetHeightFt','swingAxisHeightFt','swingAxisPointVisible','swingActivatedEnabled','swingActivatedLean','swingActivatedDelayMin','swingActivatedDelayMax','swingActivatedDrawTime','swingActivatedDelay','swingActivatorShape','swingActivatorColor','swingActivatorSize','swingActivatorYOffset','swingActivatorLeftX','swingActivatorRightX','swingHardCoverEnabled','swingHardCoverBottomEnabled','swingHardCoverBottomPercent','swingHardCoverLeftEnabled','swingHardCoverLeftPercent','swingHardCoverRightEnabled','swingHardCoverRightPercent','swingHardCoverColor','swingHardCoverOpacity'].forEach(function(id){
        bindInputEvents($(id), function(){
          opts.toggleSwingInputs();
          if(id === 'swingActivatedEnabled' || id === 'swingActivatorShape' || id === 'swingHardCoverEnabled'){ opts.updateModeUI(); }
          if((id.indexOf('swing') === 0 || id === 'useSwingPhysicalDimensions') && opts.isSwingerMode() && !opts.getSwingerState()){ opts.renderTargets(); }
          opts.persist();
        });
      });
      if(els.flowAlternate){
        els.flowAlternate.addEventListener('change', opts.persist);
      }
      if(els.flowBypassStopwatch){
        els.flowBypassStopwatch.addEventListener('change', function(){
          opts.updateModeUI();
          opts.persist();
        });
      }
      if(els.hideTargets){
        els.hideTargets.addEventListener('change', function(){
          if(opts.getPlan()){
            if(!els.hideTargets.checked){ opts.setAwaitingReveal(false); opts.setBoardHidden(false); }
            else if(opts.getAwaitingReveal()){ opts.setBoardHidden(true); }
          } else {
            opts.setAwaitingReveal(false);
            opts.setBoardHidden(false);
          }
          opts.persist();
        });
      }
      if(els.toggleMenu){
        els.toggleMenu.addEventListener('click', function(){
          var collapsed = root.classList.contains('menu-collapsed');
          opts.setMenuCollapsed(!collapsed);
        });
      }

      if(els.helpBtn){ els.helpBtn.addEventListener('click', opts.openHelp); }
      if(els.helpClose){ els.helpClose.addEventListener('click', opts.closeHelp); }
      if(els.helpOverlay){
        els.helpOverlay.addEventListener('click', function(e){
          if(e.target === els.helpOverlay){ opts.closeHelp(); }
        });
      }
      if(els.calibrateBtn){ els.calibrateBtn.addEventListener('click', opts.openCalibration); }
      if(els.calibrationClose){ els.calibrationClose.addEventListener('click', opts.closeCalibration); }
      if(els.calibrationHeight){ els.calibrationHeight.addEventListener('input', opts.updateCalibrationCard); }
      if(els.calibrationConfirm){ els.calibrationConfirm.addEventListener('click', opts.confirmCalibration); }
      if(els.calibrationOverlay){
        els.calibrationOverlay.addEventListener('click', function(e){
          if(e.target === els.calibrationOverlay){ opts.closeCalibration(); }
        });
      }

      opts.fillPresetSelect();
      if(els.savePreset){
        els.savePreset.addEventListener('click', function(){
          var name = prompt('Preset name?');
          if(!name){ return; }
          name = name.trim();
          if(!name){ return; }
          var presets = opts.loadPresetStore();
          if(presets[name] && !confirm('Overwrite preset "'+name+'"?')){ return; }
          presets[name] = opts.currentSettings();
          opts.unmarkDefaultPresetDeleted(name);
          opts.savePresetStore(presets);
          opts.fillPresetSelect(name);
        });
      }
      if(els.deletePreset){
        els.deletePreset.addEventListener('click', function(){
          var name = els.presetSelect ? els.presetSelect.value : '';
          if(!name){ alert('Select a preset to delete.'); return; }
          if(!confirm('Delete preset "'+name+'"?')) return;
          var presets = opts.loadPresetStore();
          if(presets && presets[name]){
            delete presets[name];
            opts.markDefaultPresetDeleted(name);
            opts.savePresetStore(presets);
          }
          opts.fillPresetSelect();
        });
      }
      if(els.presetSelect){
        els.presetSelect.addEventListener('change', function(e){
          var name = e.target.value;
          if(!name) return;
          var presets = opts.loadPresetStore();
          if(!presets[name]) return;
          if(opts.isRunActive()){ opts.stopRun(true); }
          opts.applySettings(presets[name]);
        });
      }
      if(els.exportPresets){ els.exportPresets.addEventListener('click', opts.exportPresetCsv); }
      if(els.importPresets && els.importPresetFile){
        els.importPresets.addEventListener('click', function(){ els.importPresetFile.click(); });
        els.importPresetFile.addEventListener('change', function(e){
          opts.importPresetCsv(e.target.files && e.target.files[0]);
          e.target.value = '';
        });
      }

      global.addEventListener('resize', opts.handleResize);
      document.addEventListener('keydown', function(e){
        var tagName = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        var isFormField = tagName === 'input' || tagName === 'select' || tagName === 'textarea' || (e.target && e.target.isContentEditable);
        if(e.key === 'Escape'){
          if(els.helpOverlay && !els.helpOverlay.hidden){ opts.closeHelp(); return; }
          if(els.calibrationOverlay && !els.calibrationOverlay.hidden){ opts.closeCalibration(); return; }
          opts.setMenuCollapsed(!root.classList.contains('menu-collapsed'));
          return;
        }
        if(isFormField){ return; }
        if(e.code === 'Space'){
          e.preventDefault();
          if(opts.isRunActive()){ opts.stopRun(false); }
          else { opts.startRun(); }
        }
      });
      global.addEventListener('pointerdown', function(){ opts.ensureAudio(); }, { once: true });
    }

    return {
      bind: bind
    };
  }

  ns.uiBindings = {
    createUiBindings: createUiBindings
  };
})(window);
