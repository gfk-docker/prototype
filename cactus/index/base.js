function addDocument(engine, meta, tokens) {
   let docobj = {
      id: engine.doc_auto_id ++,
      meta: meta,
      tf_vector: {}
   };
   tokens.forEach((term) => {
      let termobj = engine.dictionary[engine.term_id_map[term]];
      if (!termobj) {
         // new term
         termobj = {
            id: engine.term_auto_id ++,
            term: term,
            df: 0
         };
         engine.dictionary[termobj.id] = termobj;
         engine.term_id_map[term] = termobj.id;
      }
      if (!docobj.tf_vector[termobj.id]) docobj.tf_vector[termobj.id] = 0;
      docobj.tf_vector[termobj.id] ++;
   });
   Object.keys(docobj.tf_vector).forEach((term_id) => {
      engine.dictionary[term_id].df ++;
      if (!engine.reverse_index[term_id]) engine.reverse_index[term_id] = [];
      engine.reverse_index[term_id].push(docobj.id);
   });
   engine.document[docobj.id] = docobj;
   return docobj;
}

module.exports = {
   addDocument
};
