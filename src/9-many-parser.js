const updateParserState = (state, index, result) => ({
  ...state,
  index,
  result
});

const updateParserResult = (state, result) => ({
  ...state,
  result
});

const updateParserError = (state, errorMsg) => ({
  ...state,
  isError: true,
  error: errorMsg
});

class Parser {
  constructor (parserStateTransformerFn) {
    this.parserStateTransformerFn = parserStateTransformerFn;
  }

  run(targetString) {
    const initialState = {
      targetString,
      index: 0,
      result: null,
      error: null,
      isError: false
    };
  
    return this.parserStateTransformerFn(initialState);  
  }

  map(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);

      if(nextState.isError) return nextState;

      return updateParserResult(nextState, fn(nextState.result));
    });
  }

  errorMap(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState);

      if(!nextState.isError) return nextState;

      return updateParserError(nextState, fn(nextState.error, nextState.index));
    });
  }
}

const str = s => new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState;

  if(isError) {
    return parserState;
  }

  const slicedTarget = targetString.slice(index);

  if(slicedTarget.length === 0) {
    return updateParserError(parserState, `str: Tried to match ${s}, but got unexpected end of input`);
  }

  if (slicedTarget.startsWith(s)) {
    return updateParserState(parserState, index + s.length, s);
  }

  return updateParserError(parserState, `Tried to match ${s}, but got ${targetString.slice(index, index + 10)}`);
});

const lettersRegex = /^[A-Za-z]+/;
const letters = s => new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState;

  if(isError) {
    return parserState;
  }

  const slicedTarget = targetString.slice(index);

  if(slicedTarget.length === 0) {
    return updateParserError(parserState, `letters: Got unexpected end of input`);
  }

  const regexMatch = slicedTarget.match(lettersRegex);
  if (regexMatch) {
    return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0]);
  }

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  );
});

const digitsRegex = /^[0-9]+/;
const digits = s => new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState;

  if(isError) {
    return parserState;
  }

  const slicedTarget = targetString.slice(index);

  if(slicedTarget.length === 0) {
    return updateParserError(parserState, `digits: Got unexpected end of input`);
  }

  const regexMatch = slicedTarget.match(digitsRegex);
  if (regexMatch) {
    return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0]);
  }

  return updateParserError(
    parserState,
    `digits: Couldn't match digits at index ${index}`
  );
});

const sequenceOf = parsers => new Parser(parserState => {
  if(parserState.isError) {
    return parserState;
  }

  const results = [];
  let nextState = parserState;

  for(let p of parsers) {
    nextState = p.parserStateTransformerFn(nextState);
    results.push(nextState.result);
  }

  return updateParserResult(nextState, results);
});

const choice = parsers => new Parser(parserState => {
  if(parserState.isError) {
    return parserState;
  }

  for(let p of parsers) {
    const nextState = p.parserStateTransformerFn(parserState);

    if(!nextState.isError) {
      return nextState;
    }
  }

  return updateParserError(
    parserState,
    `choice: Unable to match with any parser at index ${parserState.index}`
  );
});

const many = parser => new Parser(parserState => {
  if(parserState.isError) {
    return parserState;
  }

  let nextState = parserState;
  let results = [];
  let done = false;

  while(!done) {
    let testState = parser.parserStateTransformerFn(nextState);
    if(!testState.isError) {
      results.push(testState.result);
      nextState = testState;
    } else {
      done = true;
    }
  }

  return updateParserResult(nextState, results);
});


const parser = many(choice([
  letters(),
  digits()
]));
console.log(parser.run('12abcd12'));
