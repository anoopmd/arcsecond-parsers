const str = s => parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState;

  if(isError) {
    return parserState;
  }

  if (targetString.slice(index).startsWith(s)) {
    return {
      ...parserState,
      result: s,
      index: index + s.length
    };
  }

  return {
    ...parserState,
    error: `Tried to match ${s}, but got ${targetString.slice(index, index + 10)}`,
    isError: true
  };
}

const sequenceOf = parsers => parserState => {
  if(parserState.isError) {
    return parserState;
  }

  const results = [];
  let nextState = parserState;

  for(let p of parsers) {
    nextState = p(nextState);
    results.push(nextState.result);
  }

  return {
    ...nextState,
    result: results
  }
}

const run = (parser, targetString) => {
  const initialState = {
    targetString,
    index: 0,
    result: null,
    error: null,
    isError: false
  };

  return parser(initialState);
};

const parser = sequenceOf([
  str('hello there!'),
  str('goodbye there!')
]);

console.log(run(parser, 'hello there!goodbye there!'));