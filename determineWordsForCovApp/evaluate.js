const generateXMLPayload = (answers, languageCode) => {
  // headsup: answer keys have to follow a specific pattern
  // there is no error handling yet. slice might be unneccesary.
  // TODO: declare allowed pattern for keys.
  // TODO: order of recommendations?
  const xmlTagList = Object.keys(answers).map(a => {
    return `<${a}>${answers[a]}</${a}>`
  })
  console.log(JSON.stringify(xmlTagList));
  const xmlTags = xmlTagList.join("")
  const answersXML = `<PATIENT>${xmlTags}</PATIENT>`
  return {"answer": answersXML, "language": languageCode}
}

const evalCondtion = (value, operand, targetValue) => {

    switch (operand) {
      case "==":
        return value === targetValue
      case "!=":
        return value !== targetValue
      case "<=":
        return value <= targetValue
      case ">=":
        return value >= targetValue
      case "&&":
        return value && targetValue
      case "||":
        return value || targetValue
      default:
        console.log("FAIL RAISE ERROR")
        return undefined
    }
  }

  const getEvaluations = (statements, conditions, answers) => {

    /*  evaluate each statement's conditions with the answers given. return array of strings */

    let evaluations = []

    statements.forEach(statement => {

      let truthList = []

      statement.conditions.forEach((conditionUUID, i) => {
        let condition = conditions.find(cond => cond.uuid === conditionUUID)
        let conditionTruthList = []
        let conditionTrue

        /* statement conditions can be chained together. if theres is a follow-up condition, current condition will have combination property */

        if (condition.hasOwnProperty("combination")) {

          let nextconditionUUID = statement.conditions[i+1]
          let nextcondition = conditions.find(cond => cond.uuid === nextconditionUUID)
          let nextcondtionTruthList = []

          nextcondition.selected.forEach(sel => {
            let answer = answers[sel]
            let { operand, value} = nextcondition
            let {val, offset} = value
            answer = parseInt(answer)// - 1
            val = parseInt(val) + parseInt(offset)
            let nextconditionTrue = evalCondtion(answer, operand, val)
            //console.log(`${answer} ${operand} ${val} is ${nextconditionTrue}`)
            nextcondtionTruthList.push(nextconditionTrue)
          })

          condition.selected.forEach(sel => {
            let answer = answers[sel]
            let { operand, value} = condition
            let {val, offset} = value
            answer = parseInt(answer)// - 1
            val = parseInt(val) + parseInt(offset)
            let conditionTrue = evalCondtion(answer, operand, val)
            //console.log(`${answer} ${operand} ${val} is ${conditionTrue}`)
            conditionTruthList.push(conditionTrue)
          })

          let cListTrue = conditionTruthList.every(c => c === true)
          let nListTrue = nextcondtionTruthList.every(c => c === true)

          conditionTrue = evalCondtion(
            cListTrue, condition.combination, nListTrue
          )
        }

        else {

          condition.selected.forEach(sel => {
            let answer = answers[sel]
            let { operand, value} = condition
            let {val, offset} = value
            answer = parseInt(answer)// -1
            val = parseInt(val) + parseInt(offset)
            let conditionTrue = evalCondtion(answer, operand, val)
            //console.log(`${answer} ${operand} ${val} is ${conditionTrue}`)
            conditionTruthList.push(conditionTrue)
          })

          conditionTrue = conditionTruthList.every(c => c === true)
        }

        if (i + 1 !== statement.conditions.length || i === 0) {
          truthList.push(conditionTrue)
        }

      })

      truthList.every(t => t === true) ? evaluations.push(statement.trueText) : evaluations.push(statement.falseText)

    })

    console.log(JSON.stringify(evaluations))

    return evaluations
  }

const answersToStatements = (answers, scoreMap) => {

  const { conditions, statements } = JSON.parse(scoreMap);

  let s = Object.keys(statements).map(x => statements[x]),
      c = Object.keys(conditions).map(x => conditions[x])
  
  return getEvaluations(s, c, answers).join('')
};

const functions = {
  generateXMLPayload, answersToStatements
};

module.exports = functions;