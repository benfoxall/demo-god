var RE = /^[0-9a-z-]+$/

function validate(slug) {

  if(typeof slug !== "string")
    throw "must be string"

  if(slug.length > 10)
    throw "must be fewer than 10 characters"

  if(!slug.length)
    throw "must be something"

  if(!RE.exec(slug))
    throw "lower case characters or numbers only"

  return slug

}

module.exports = validate
