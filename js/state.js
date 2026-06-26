/*
 * SPDX-FileCopyrightText: 2026 Alexander Doner
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function(global){
  'use strict';

  var ns = global.TargetTrainer = global.TargetTrainer || {};

  function createJsonStore(storage){
    storage = storage || global.localStorage;

    function read(key){
      try{
        var raw = storage.getItem(key);
        if(!raw) return null;
        var data = JSON.parse(raw);
        return (data && typeof data === 'object') ? data : null;
      }catch(e){
        return null;
      }
    }

    function write(key, value){
      try{ storage.setItem(key, JSON.stringify(value)); }catch(e){}
    }

    return {
      read: read,
      write: write
    };
  }

  ns.state = {
    createJsonStore: createJsonStore
  };
})(window);
