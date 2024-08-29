// middlewares for authorization. might move to another module?


function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader === 'undefined') {
      return res.sendStatus(403);
    }
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
  
    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(403);
      }
  
    req.token = decodedToken;
    next();
  });
  }
  
  function verifyAdmin(req, res, next) {
      if (req.token.type !== "Admin") {
          return res.sendStatus(403);
      }
      next();
  }
  
  // Validation middlewares
  
  function validateRegistration(req, res, next) {
    const { error } = registrationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
  
  function validateLogin(req, res, next) {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
  
  function validatePost(req, res, next) {
    const { error } = postSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
  
  function validateUpdatePost(req, res, next) {
    const { error } = updatePostSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
  
  function validateComment(req, res, next) {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
  
  function validateUpdateComment(req, res, next)  {
    const { error } = updateCommentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };

  module.exports = {
    validateLogin,
    validatePost,
    validateComment,
    validateRegistration,
    validateUpdateComment,
    validateUpdatePost,
    verifyAdmin,
    verifyToken
  }