# How to add patterns

To understand how to add a pattern to this project we wil follow the adding of the function pattern

1. Add pattern to grammar

in the grammar file, we add all necisary rules for this pattern's input.

```
functions   ::= ('linkage:' 'internal' | 'external') ('name:' id) ('params:') (('-' type)*) ('return type:' type);
```

If we look at the first group `('linkage:' 'internal' | 'external') ` we can see that this represents the user selecting between two different kinds of linkage types, internal and external.

Another thing you notice about this rule is the use of parenthesis to group parts of the grammar when they aren't actually needed. While use of the parenthesis provide clarity in the code, they can also be used to format output. All elements in a parenthesis grouping are aligned horozontally and the end of a grouping represents a line break on the web page.


2. add production rule to the output visitor

For every rule you add to the grammar you must add a corrosponding function to the derived visitor class. For the `functions` rule the function we must add looks like this:

```
visitfunctions_node(node: functions_node): Output {

}
```

For the return value of this function we need to think about three things,
1. what `#import`s do we have to add due to this segment of code
2. what are the variables that would be redudant to redifine here and can assume that the reader understands how to create.
3. what is the actual outputed code

we bundle these three things into an output:

`let ret = new Output();`

for inports we add them like this
`ret.imports.add("llvm/IR/IRBuilder.h");`

The next question is answered by 
`ret.inputs["builder"] = builder;`

currently the task of syntax highlighting is given to a human which is something I really need to take out and replace. But in the current state of the program builder is an array of strings each with their own color and hyperlink information which is extremly tedious to write, so I am going to change that system to have auto sytax highlighting and allow for embedded links to just be put right in the text. 

The third question is answered in a similar way, where the ret.outputs variable is manipulated instead of the inputs variable
