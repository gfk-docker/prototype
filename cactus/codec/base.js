const i_fs = require('fs');
const i_path = require('path');
const i_storage = require('../storage/base');

/* {id, term, df} */
function readDictionary(dir) {
   let filename = i_path.join(dir, 'dictionary.json');
   return JSON.parse(i_fs.readFileSync(filename));
}

/* {id, meta, tf_vec} */
function readDocument(dir) {
   let filename = i_path.join(dir, 'document.json');
   return JSON.parse(i_fs.readFileSync(filename));
}

/* {term_id: [doc_id]} */
function readReverseIndex(dir) {
   let filename = i_path.join(dir, 'reverse_index.json');
   return JSON.parse(i_fs.readFileSync(filename));
}

function createEngine() {
   return {
      term_auto_id: 1,
      doc_auto_id: 1,
      dictionary: {},
      term_id_map: {},
      document: {},
      reverse_index: {}
   }
}

function readEngine(dir) {
   let engine = createEngine();
   engine.dictionary = readDictionary(dir);
   engine.document = readDocument(dir);
   engine.reverse_index = readDocument(dir);
   engine.term_auto_id = 1;
   engine.doc_auto_id = 1;
   engine.term_id_map = {};
   Object.keys(engine.dictionary).forEach((id) => {
      id = parseInt(id);
      engine.term_id_map[engine.dictionary[id].term] = id;
      if (engine.term_auto_id <= id) engine.term_auto_id = id+1;
   });
   Object.keys(engine.document).forEach((id) => {
      id = parseInt(id);
      if (engine.doc_auto_id <= id) engine.doc_auto_id = id+1;
   });
   return engine;
}

function writeDictionary(dir, obj) {
   let filename = i_path.join(dir, 'dictionary.json');
   i_fs.writeFileSync(filename, JSON.stringify(obj));
}

function writeDocument(dir, obj) {
   let filename = i_path.join(dir, 'document.json');
   i_fs.writeFileSync(filename, JSON.stringify(obj));
}

function writeReverseIndex(dir, obj) {
   let filename = i_path.join(dir, 'reverse_index.json');
   i_fs.writeFileSync(filename, JSON.stringify(obj));
}

function writeEngine(dir, engine) {
   writeDictionary(dir, engine.dictionary);
   writeDocument(dir, engine.document);
   writeReverseIndex(dir, engine.reverse_index);
}

module.exports = {
   createEngine,
   readEngine,
   writeEngine
};
