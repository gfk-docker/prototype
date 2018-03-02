import ast
import sys
import re

class NumberExtractor(ast.NodeVisitor):

   def __init__(self, text_lines, output, abposition):
      super(NumberExtractor, self).__init__();
      self.text_lines = text_lines
      self.output = output
      self.abposition = abposition

   def visit_Num(self, node):
      start_index = self.abposition[node.lineno-1] + node.col_offset
      line = self.text_lines[node.lineno-1][node.col_offset:]
      # conflict with ip addr
      m = re.search(r'[+-]?([.]?\d+)([.]\d+)?', line)
      if not m: return
      end_index = start_index + len(m.group(0))
      self.output.append({
         'startIndex': start_index,
         'endIndex': end_index,
         'value': node.n,
      })

def cache_position(text):
   text_lines = text.split('\n')
   text_lines_rlposition = map(lambda x: len(x), text_lines)
   last = 0
   text_lines_abposition = []
   for position in text_lines_rlposition:
      text_lines_abposition.append(last)
      last += position+1
   return text_lines_abposition

def parse(filename):
   text = None
   tree_root = None
   with open(filename, 'r') as f:
      text = f.read()
      tree_root = ast.parse(text)

   numbers = []
   text_lines_abposition = cache_position(text)

   traverse = NumberExtractor(text.split('\n'), numbers, text_lines_abposition)
   traverse.visit(tree_root)
   return numbers

def main():
   filename = sys.argv[1]
   print(parse(filename))


if __name__ == '__main__':
   main()
