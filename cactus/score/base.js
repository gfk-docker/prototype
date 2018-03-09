function score(engine, tokens, doc_set) {
   tokens = tokens.map((term) => engine.term_id_map[term]).filter((id) => (id > 0));
   let doc_n = Object.keys(engine.document).length;
   let result_max = -Infinity, result_min = Infinity;
   Object.keys(doc_set).forEach((doc_id) => {
      let docobj = engine.document[doc_id];
      let doc_term_n = Object.values(docobj.tf_vector).reduce((x,y) => x+y); /* not used */
      let result = tokens.map((term_id) => {
         let value = (
            (1+Math.log(docobj.tf_vector[term_id])) *
            Math.log(doc_n/engine.dictionary[term_id].df)
         );
         if (value > result_max) result_max = value;
         if (value < result_min) result_min = value;
         return value;
      }).reduce((x,y) => x+y);
      doc_set[doc_id] = result;
   });
   // normalize(doc_set, result_min, result_max);
   return doc_set;
}

function normalize(doc_set, min, max) {
   if (min === max) {
      Object.keys(doc_set).forEach((doc_id) => {
         doc_set[doc_id] = 1;
      });
   } else {
      let max_d_min = max - min;
      // [min, max] => [0, 1]
      Object.keys(doc_set).forEach((doc_id) => {
         doc_set[doc_id] -= min;
         doc_set[doc_id] /= max_d_min;
      });
   }
}

module.exports = {
   score
};
