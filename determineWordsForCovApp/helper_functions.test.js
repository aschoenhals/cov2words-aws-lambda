const fn = require('./helper_functions')

const sampleAnswers = {
  "personalInfo_P0": 1,
  "personalInfo_P1": 2,
  "personalInfo_P2": 1,
  "contact_CZ": 25,
}

const sampleThresholdMap = {
  "personalInfo": {
    "threshold": 2,
    "recoms": {
      "isDanger": "Lorem",
      "isSafe": "Ipusm"
    }  
  },
  "contact": {
    "threshold": 1,
    "recoms": {
      "isDanger": "Hell",
      "isSafe": "yeah"
    }
  }
}

describe("function generateXMLPayload", () => {
  let answer, expectedAnswer
  beforeEach(() => {
    answers = sampleAnswers
  })
  test("returns expected object", () => {
    expectedAnswer = {
      "answer": "<PATIENT><P0>1</P0><P1>2</P1><P2>1</P2><CZ>25</CZ></PATIENT>",
      "language": "de"
    }
    expect(fn.generateXMLPayload(answers, "de"))
      .toEqual(expectedAnswer)
  })
})

describe("function answersToRecommendation", () => {
  it("returns expected string", () => {
    expectedAnswer = "Lorem Hell"
    expect(fn.answersToRecommendation(sampleAnswers, sampleThresholdMap))
      .toEqual(expectedAnswer)
  })
})