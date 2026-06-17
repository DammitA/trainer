(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  var SETTINGS_SCHEMA = [
    { key: 'sessionMode', type: 'value', fallback: 'board' },
    { key: 'timerMode', type: 'value', fallback: 'single' },
    { key: 'delayMin', type: 'number', fallback: 0, defaultValue: 1 },
    { key: 'delayMax', type: 'number', fallback: 0, defaultValue: 3 },
    { key: 'workDuration', type: 'number', fallback: 0, defaultValue: 5 },
    { key: 'repeats', type: 'integer', fallback: 0 },
    { key: 'reloadTime', type: 'number', fallback: 0 },
    { key: 'shotCount', type: 'integer', fallback: 0, defaultValue: 6 },
    { key: 'shotSplit', type: 'number', fallback: 0, defaultValue: 0.25 },
    { key: 'firstShotTime', type: 'number', fallback: 0, defaultValue: 0.75 },
    { key: 'shotReloads', type: 'integer', fallback: 0 },
    { key: 'flowStopMode', type: 'value', fallback: 'time' },
    { key: 'flowStopSeconds', type: 'number', fallback: 0, defaultValue: 10 },
    { key: 'flowStopTargets', type: 'integer', fallback: 0, defaultValue: 20 },
    { key: 'targetCount', type: 'integer', fallback: 0, defaultValue: 8 },
    { key: 'targetShape', type: 'value', fallback: 'circle' },
    { key: 'targetColor', type: 'value', fallback: '#d62828' },
    { key: 'targetLayout', type: 'value', fallback: 'random' },
    { key: 'gridRows', type: 'integer', fallback: 0 },
    { key: 'gridCols', type: 'integer', fallback: 0 },
    { key: 'gridSpread', type: 'number', fallback: 100 },
    { key: 'useGridPhysicalSpacing', type: 'checkbox', fallback: false },
    { key: 'gridSpacingFt', type: 'number', fallback: 0, defaultValue: 2 },
    { key: 'targetNumbered', type: 'checkbox', fallback: false, defaultValue: true },
    { key: 'randomTargetColors', type: 'checkbox', fallback: false },
    { key: 'darkBoard', type: 'checkbox', fallback: false },
    { key: 'randomSizes', type: 'checkbox', fallback: false },
    { key: 'hideTargets', type: 'checkbox', fallback: false },
    { key: 'targetSize', type: 'number', fallback: 0, defaultValue: 80 },
    { key: 'useDistanceScale', type: 'checkbox', fallback: false },
    { key: 'screenDistanceFt', type: 'number', fallback: 0, defaultValue: 2 },
    { key: 'targetDistanceYd', type: 'number', fallback: 0, defaultValue: 10 },
    { key: 'targetSizeMin', type: 'number', fallback: 0, defaultValue: 50 },
    { key: 'targetSizeMax', type: 'number', fallback: 0, defaultValue: 120 },
    { key: 'flowEdge', type: 'value', fallback: 'left' },
    { key: 'flowPlacement', type: 'value', fallback: 'random' },
    { key: 'flowAlternate', type: 'checkbox', fallback: false },
    { key: 'flowBypassStopwatch', type: 'checkbox', fallback: false },
    { key: 'flowSpeed', type: 'number', fallback: 0, defaultValue: 280 },
    { key: 'flowRate', type: 'number', fallback: 0, defaultValue: 1.5 },
    { key: 'swingRate', type: 'number', fallback: 0, defaultValue: 180 },
    { key: 'swingTargetHeight', type: 'number', fallback: 0, defaultValue: 300 },
    { key: 'swingAxisHeight', type: 'number', fallback: 0, defaultValue: 80 },
    { key: 'useSwingPhysicalDimensions', type: 'checkbox', fallback: false },
    { key: 'swingTargetHeightFt', type: 'number', fallback: 0, defaultValue: 2 },
    { key: 'swingAxisHeightFt', type: 'number', fallback: 0, defaultValue: 0.5 }
  ];

  function getSettingsDefaults(){
    var defaults = {};
    SETTINGS_SCHEMA.forEach(function(field){
      defaults[field.key] = field.defaultValue !== undefined ? field.defaultValue : field.fallback;
    });
    return defaults;
  }

  var SETTINGS_DEFAULTS = getSettingsDefaults();
  var SETTINGS_FIELDS = SETTINGS_SCHEMA.map(function(field){ return field.key; });

  function normalizeSettings(state){
    var normalized = {};
    state = (state && typeof state === 'object') ? state : {};
    SETTINGS_FIELDS.forEach(function(key){
      normalized[key] = state[key] !== undefined ? state[key] : SETTINGS_DEFAULTS[key];
    });
    return normalized;
  }

  function readField(els, field){
    var el = els[field.key];
    if(field.type === 'checkbox'){
      return !!(el && el.checked);
    }
    if(!el){ return field.fallback; }
    if(field.type === 'integer'){
      return parseInt(el.value, 10) || field.fallback;
    }
    if(field.type === 'number'){
      return parseFloat(el.value) || field.fallback;
    }
    return el.value || field.fallback;
  }

  function currentSettings(els){
    var state = {};
    SETTINGS_SCHEMA.forEach(function(field){
      state[field.key] = readField(els || {}, field);
    });
    return normalizeSettings(state);
  }

  function applySettings(els, state){
    state = normalizeSettings(state);
    SETTINGS_SCHEMA.forEach(function(field){
      var el = els && els[field.key];
      var val = state[field.key];
      if(!el || val == null || val === '') return;
      if(field.type === 'checkbox'){
        el.checked = !!val;
      } else {
        el.value = val;
      }
    });
    return state;
  }

  ns.settings = {
    SETTINGS_SCHEMA: SETTINGS_SCHEMA,
    SETTINGS_DEFAULTS: SETTINGS_DEFAULTS,
    SETTINGS_FIELDS: SETTINGS_FIELDS,
    normalizeSettings: normalizeSettings,
    currentSettings: currentSettings,
    applySettings: applySettings
  };
})(window);
