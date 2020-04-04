const generateXMLPayload = (answer, languageCode) => {
  // headsup: answer keys have to follow a specific pattern
  // there is no error handling yet. slice might be unneccesary.
  // TODO: declare allowed pattern for keys.
  const xmlTagList = Object.keys(answer).map(a => {
    const tag = a.split("_")[1]
    return `<${tag}>${answer[a]}</${tag}>`
  })
  const xmlTags = xmlTagList.join("")
  const answerX = `<PATIENT>${xmlTags}</PATIENT>`
  return {"answer": answerX, "language": languageCode}
}

const answersToRecommendation = (answers, thresholdMap) => {
  const categories = {}
  Object.keys(answers).forEach((answer,i) => {
    let cat = answer.split("_")[0]
    categories.hasOwnProperty(cat)
      ? categories[cat]++
      : categories[cat] = 1
  })

  let recomList = Object.keys(categories).map(cat => {
    const recom = categories[cat] >= thresholdMap[cat].threshold
      ? thresholdMap[cat].recoms.isDanger
      : thresholdMap[cat].recoms.isSafe
    return recom
  })

  return recomList.join(" ")
}

const functions = {
  generateXMLPayload, answersToRecommendation
}

module.exports = functions