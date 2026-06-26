/*
 * SPDX-FileCopyrightText: 2026 Alexander Doner
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function fillPresetSelect(select, presets, selected){
    if(!select) return;
    while(select.firstChild){ select.removeChild(select.firstChild); }

    var emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Load preset...';
    select.appendChild(emptyOption);

    Object.keys(presets || {}).sort().forEach(function(name){
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    if(selected && presets && presets[selected]){
      select.value = selected;
    } else {
      select.value = '';
    }
  }

  function csvEscape(value){
    var s = String(value == null ? '' : value);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function parseCsvLine(line){
    var out = [];
    var cur = '';
    var quoted = false;
    for(var i=0;i<line.length;i++){
      var ch = line[i];
      if(quoted){
        if(ch === '"' && line[i+1] === '"'){ cur += '"'; i += 1; }
        else if(ch === '"'){ quoted = false; }
        else { cur += ch; }
      } else if(ch === ','){
        out.push(cur);
        cur = '';
      } else if(ch === '"'){
        quoted = true;
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  function buildPresetCsv(presets, normalizeSettings){
    normalizeSettings = normalizeSettings || function(state){ return state || {}; };
    var rows = ['name,preset_json'];
    Object.keys(presets || {}).sort().forEach(function(name){
      rows.push(csvEscape(name) + ',' + csvEscape(JSON.stringify(normalizeSettings(presets[name]))));
    });
    return rows.join('\n') + '\n';
  }

  function parsePresetCsv(text, normalizeSettings){
    normalizeSettings = normalizeSettings || function(state){ return state || {}; };
    text = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = text.split('\n').filter(function(line){ return line.trim() !== ''; });
    var result = { presets: {}, imported: 0, skipped: 0, errors: [] };
    if(!lines.length){
      result.errors.push('No presets found in file.');
      return result;
    }
    for(var i=1;i<lines.length;i++){
      var cols = parseCsvLine(lines[i]);
      var name = (cols[0] || '').trim();
      if(!name || !cols[1]){
        result.skipped += 1;
        continue;
      }
      try{
        result.presets[name] = normalizeSettings(JSON.parse(cols[1]));
        result.imported += 1;
      }catch(e){
        result.skipped += 1;
        result.errors.push('Row ' + (i + 1) + ' has invalid preset JSON.');
      }
    }
    return result;
  }

  function exportPresetCsv(opts){
    opts = opts || {};
    var text = buildPresetCsv(opts.presets || {}, opts.normalizeSettings);
    var blob = new Blob([text], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = opts.filename || 'target-trainer-presets.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 0);
  }

  function importPresetCsv(file, opts){
    opts = opts || {};
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      var result = parsePresetCsv(reader.result, opts.normalizeSettings);
      if(result.errors.length && !result.imported){
        opts.alert(result.errors[0]);
        return;
      }
      var presets = opts.loadPresetStore();
      Object.keys(result.presets).forEach(function(name){
        presets[name] = result.presets[name];
        opts.unmarkDefaultPresetDeleted(name);
      });
      opts.savePresetStore(presets);
      opts.fillPresetSelect();
      opts.alert(result.imported ? ('Imported ' + result.imported + ' preset(s).') : 'No valid presets imported.');
    };
    reader.readAsText(file);
  }

  ns.presets = {
    fillPresetSelect: fillPresetSelect,
    csvEscape: csvEscape,
    parseCsvLine: parseCsvLine,
    buildPresetCsv: buildPresetCsv,
    parsePresetCsv: parsePresetCsv,
    exportPresetCsv: exportPresetCsv,
    importPresetCsv: importPresetCsv
  };
})(window);
