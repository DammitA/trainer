(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  var MADNESS_LAYOUT = {
    id: 'cm-03-08-madness',
    name: 'CM 03-08 Madness',
    description: '7 metric targets with 4 no-shoots, set at shoulders height.',
    summary: '7 metric targets, 4 no-shoots, with size-by-distance enabled.',
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

  var CS_040_LAYOUT = {
    id: 'icore-cs-040-this-looks-familiar',
    name: 'ICORE CS-040 This Looks Familiar',
    description: '4 NRA D-1 targets with hard cover on T2 and T3.',
    summary: '4 NRA D-1 targets, outer targets at 10 yards and inner targets at 7 yards, hard cover on T2 and T3.',
    targetShape: 'd1',
    targetHeightInches: 30,
    targetCount: 4,
    layoutSpanTargetWidths: 10,
    stageProcedure:
      'Start Position: Standing facing down range in Box A, revolver loaded and holstered, hands relaxed at sides, wrists below belt.\n' +
      'Procedure: At start signal, engage T1 thru T4 with only one round each in any order. One continuous string. Perform a mandatory reload and re-engage T1 thru T4 with only one round each in any order. Perform a mandatory reload and re-engage T1 thru T4 with only one round each in any order, STRONG HAND ONLY. Perform a mandatory reload and re-engage T1 thru T4 with only one round each in any order, WEAK HAND ONLY.\n' +
      'Scoring: Shots Limited. Targets: 4 NRA D-1 paper. Rounds: 16 maximum. Start: Audible. Stop: Last shot. Penalties per the ICORE rulebook; foot faults, extra shots, extra hits, procedurals, and misses are 5 seconds per occurrence.\n' +
      'Stage Setup: Inside edges of T1 and T4 are 6 ft off centerline. Inside edges of T2 and T3 are 1 ft off centerline. Hard cover on T2 and T3 runs from the bottom inside corner to the opposite shoulder corner where the straight wall becomes the semicircle top. Set all targets at standard height, 5 ft 5 in. Shooting box is approximately 3 ft x 3 ft. Render T1 and T4 at 10 yards, and T2 and T3 at 7 yards.\n' +
      '100% reference times by division:\n' +
      '- Open: 13.97 seconds\n' +
      '- Limited: 16.31 seconds\n' +
      '- Classic: 18.67 seconds\n' +
      '- Big 6: 20.83 seconds',
    // NRA D-1 targets are modeled at 18" wide by 30" tall.
    // Stage setup gives the inside edges of T1/T4 at 6 ft and T2/T3 at 1 ft from centerline.
    labels: ['T1', 'T2', 'T3', 'T4'],
    kinds: ['target', 'target', 'target', 'target'],
    hardCover: ['', 'lower-left', 'lower-right', ''],
    distancesYd: [10, 7, 7, 10],
    positions: [
      0,
      0.3703703704,
      0.6296296296,
      1
    ]
  };

  var CLASSIFIERS = [MADNESS_LAYOUT, CS_040_LAYOUT];

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
