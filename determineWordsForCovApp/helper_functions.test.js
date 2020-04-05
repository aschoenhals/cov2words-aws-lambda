const fn = require('./helper_functions')

// sampleAnswer: the value of each key is the actual score of the question. not the userinput!
const sampleAnswers1 = {
  "personalInfo_P0": 1,
  "personalInfo_P1": 2,
  "personalInfo_P2": 1,
  "contact_CZ": 25,
}

const sampleAnswers2 = {
  "personalInfo_P0": 1,
  "personalInfo_P1": 2,
  "personalInfo_P2": 1,
  "contact_CZ": 0,
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

const fooMap = {
  contact: {
    threshold: 0,
    recoms: {
      isDanger: "lorem contact",
      isSafe: "ipsum contact"
    }
  },
  personalInfo: {
    threshold: 0,
    recoms: {
      isDanger: "lorem personal",
      isSafe: "ipsum personal"
    }
  },
  symptoms: {
    threshold: 0,
    recoms: {
      isDanger: "lorem",
      isSafe: "ipsum"
    }
  },
  respiratorySymptoms: {
    threshold: 0,
    recoms: {
      isDanger: "lorem",
      isSafe: "ipsum"
    }
  },
  illnesses: {
    threshold: 0,
    recoms: {
      isDanger: "lorem",
      isSafe: "ipsum"
    }
  },
  medication: {
    threshold: 0,
    recoms: {
      isDanger: "lorem",
      isSafe: "ipsum"
    }
  }
}

describe("function generateXMLPayload", () => {
  let answer, expectedAnswer
  beforeEach(() => {
    answers = sampleAnswers1
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
    expect(fn.answersToRecommendation(sampleAnswers1, JSON.stringify(sampleThresholdMap)))
      .toEqual(expectedAnswer)
  })
  it("returns expected string", () => {
    expectedAnswer = "Lorem yeah"
    expect(fn.answersToRecommendation(sampleAnswers2, JSON.stringify(sampleThresholdMap)))
      .toEqual(expectedAnswer)
  })
  it("returns expected string", () => {
    expectedAnswer = "lorem personal lorem contact"
    expect(fn.answersToRecommendation(sampleAnswers1, JSON.stringify(fooMap)))
      .toEqual(expectedAnswer)
  })
  it("returns expected string", () => {
    expectedAnswer = "lorem personal ipsum contact"
    expect(fn.answersToRecommendation(sampleAnswers2, JSON.stringify(fooMap)))
      .toEqual(expectedAnswer)
  })
})