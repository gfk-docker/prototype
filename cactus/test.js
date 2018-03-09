const i_analysis = require('./analysis/base');
const i_codec = require('./codec/base');
const i_index = require('./index/base');
const i_search = require('./search/base');
const i_score = require('./score/base');

let engine = i_codec.createEngine();
i_index.addDocument(engine, {name: 'hello'}, i_analysis.tokenizeWithoutStops('hello world'));
i_index.addDocument(engine, {name: 'how are u'}, i_analysis.tokenizeWithoutStops('hello hello how are you?'));
i_index.addDocument(engine, {name: 'hello repeater'}, i_analysis.tokenizeWithoutStops('hello hello hello?'));
i_index.addDocument(engine, {name: 'what a bug'}, i_analysis.tokenizeWithoutStops('what a bug'));
let query = ['hello'];
let doc_set = i_search.search(engine, query);
doc_set = i_score.score(engine, query, doc_set);
Object.keys(doc_set).forEach((doc_id) => {
   doc_set[doc_id] = {
      score: doc_set[doc_id],
      document: engine.document[doc_id].meta
   };
});
console.log(doc_set);
