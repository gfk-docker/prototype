function search(engine, tokens) {
   let doc_set = {};
   tokens.forEach((term) => {
      let term_id = engine.term_id_map[term];
      let doc_subset = engine.reverse_index[term_id];
      if (!doc_subset) return;
      doc_subset.forEach((doc_id) => {
         doc_set[doc_id] = 1;
      });
   });
   return doc_set;
}

module.exports = {
   search
};
