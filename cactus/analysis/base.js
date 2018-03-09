const common_stops = [
   '~', '`', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
   '-', '_', '=', '+', '{', '}', '[', ']', '\\', '|', ':', ';',
   '"', '\'', ',', '.', '<', '>', '/', '?', ' ', '\t', '\r', '\n'
];

function tokenize(text) {
   let output = [];
   let n = text.length;
   let last = 0;
   for (let i = 0; i < n; i++) {
      let ch = text.charAt(i);
      if (common_stops.indexOf(ch) >= 0) {
         if (last < i) {
            output.push(text.substring(last, i));
         }
         output.push(ch);
         last = i + 1;
      }
   }
   if (last < n) output.push(text.substring(last));
   return output;
}

function tokenizeWithoutStops(text) {
   let output = [];
   let n = text.length;
   let last = 0;
   for (let i = 0; i < n; i++) {
      let ch = text.charAt(i);
      if (common_stops.indexOf(ch) >= 0) {
         if (last < i) {
            output.push(text.substring(last, i));
         }
         last = i + 1;
      }
   }
   if (last < n) output.push(text.substring(last));
   return output;
}

module.exports = {
   tokenize,
   tokenizeWithoutStops
};
