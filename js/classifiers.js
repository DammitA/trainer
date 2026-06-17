(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  var MADNESS_LAYOUT = {
    id: 'cm-03-08-madness',
    name: 'CM 03-08 Madness',
    description: '7 metric targets with 4 no-shoots, set at shoulders height.',
    targetShape: 'metric',
    targetHeightInches: 30,
    targetCount: 11,
    layoutSpanTargetWidths: 11,
    stageProcedure:
      'Standing in Box A facing targets, wrists above respective shoulders. Handgun is loaded and holstered as per ready condition in rule 8.1.1 and 8.1.2.\n' +
      'Upon start signal, from Box A only, engage T1-T7 with only one round per target, perform a mandatory reload, and reengage T1-T7 with only one round per target.\n' +
      'Desired distance should be set to 10 yards.',
    // Layout notes:
    // - Metric targets are modeled at 18" wide by 30" tall.
    // - T4 is centered on the centerline.
    // - T1 and T7 keep the 1 ft outer-edge gap to their adjacent targets.
    // - All non-center objects are shifted inward by 3" (one C-zone width).
    // - The no-shoots between T2/T3 and T5/T6 are referenced from the adjacent C-zone verticals.
    // - The no-shoots between T3/T4 and T4/T5 are referenced from the adjacent C/A zone verticals.
    labels: ['T1', 'T2', '', 'T3', '', 'T4', '', 'T5', '', 'T6', 'T7'],
    kinds: ['target', 'target', 'no-shoot', 'target', 'no-shoot', 'target', 'no-shoot', 'target', 'no-shoot', 'target', 'target'],
    // Center positions normalized across the intrinsic layout span.
    positions: [
      0.0151515152,        // T1
      0.1818181819,        // T2
      0.2651515152,        // NS between T2/T3
      0.3484848485,        // T3
      0.4333901515,        // NS between T3/T4
      0.5,                 // T4
      0.5666098485,        // NS between T4/T5
      0.6515151515,        // T5
      0.7348484848,        // NS between T5/T6
      0.8181818182,        // T6
      0.9848484848         // T7
    ]
  };

  var CLASSIFIERS = [MADNESS_LAYOUT];

  function getClassifierList(){
    return CLASSIFIERS.slice();
  }

  function getClassifierById(id){
    id = id || '';
    for(var i = 0; i < CLASSIFIERS.length; i += 1){
      if(CLASSIFIERS[i].id === id){ return CLASSIFIERS[i]; }
    }
    return CLASSIFIERS[0] || null;
  }

  function getDefaultClassifierId(){
    return CLASSIFIERS[0] ? CLASSIFIERS[0].id : '';
  }

  ns.classifiers = {
    getClassifierList: getClassifierList,
    getClassifierById: getClassifierById,
    getDefaultClassifierId: getDefaultClassifierId
  };
})(window);
