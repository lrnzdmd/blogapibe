const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const database = require('./src/services/database');
const verifyMW = require('./src/middlewares/validations')
const LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();



const app = express();

app.use(passport.initialize());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await database.getUserByName(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await database.getUserById(user.id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});


// routes for crud operations on posts.

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await database.getAllPosts();
    return res.json({posts:posts});
  } catch (error) {
    console.error('Error fetching posts list');
    return res.status(500).json({error:'Error fetching posts list'});
  }
});

app.get('/api/posts/all', verifyMW.verifyToken, verifyMW.verifyAdmin, async (req, res) => {
  try {
    const posts = await database.getAllPostsUnpub();
    return res.json({posts:posts});
  } catch (error) {
    console.error('Error fetching posts list');
    return res.status(500).json({error:'Error fetching posts list'});
  }
});

app.get('/api/posts/list/latest', async (req, res) => {
  try {
    const posts = await database.getLatestPosts();
    return res.json({posts});
  } catch (error) {
    console.error('Error fetching posts list');
    return res.status(500).json({error:'Error fetching posts list'});
  }
});

app.get('/api/posts/list/popular', async (req, res) => {
  try {
    const posts = await database.getPopularPosts();
    return res.json({posts});
  } catch (error) {
    console.error('Error fetching posts list');
    return res.status(500).json({error:'Error fetching posts list'});
  }
});

app.get('/api/posts/:postid', async (req, res) => {
    const postId = parseInt(req.params.postid);
    try {
    const post = await database.getPostById(postId);
    console.log(post);
    return res.json({ post: post });
    } catch (error) {
      console.error('Error fetching post from server: ',error);
      return res.status(500).json({error:'Error fetching post.'});
    }
});

app.post('/api/posts', verifyMW.verifyToken, verifyMW.verifyAdmin, verifyMW.validatePost, async (req, res) => {
    try {
       const post = await database.createPost(req.body.title, req.body.text, req.token.id);
       
      return res.json({ message: 'Post inserted correctly in database'});       
    } catch (error) {
        console.error('Error creating post', error);
        return res.status(500).json({error:'Error creating post.'});
    }
  
});

app.patch('/api/posts/:postid', verifyMW.verifyToken, verifyMW.verifyAdmin, verifyMW.validateUpdatePost, async (req, res) => {
    const postId = parseInt(req.params.postid);
    const updateData = parseEditPostBody(req.body);
  try {
    const updatedPost = await database.updatePost(postId, updateData);
    return res.json( {message: 'Post updated successfully'});
    
  } catch (error) {
    console.error('Error updating post: ', error);
    return res.status(500).json({error:'Error updating post.'})
  }
})

app.patch('/api/posts/:postid/publish', verifyMW.verifyToken, verifyMW.verifyAdmin, async (req, res) => {
  const postId = parseInt(req.params.postid);
try {
  const publishedPost = await database.togglePublishPost(postId);
  return res.json( {message: 'Post published successfully'});
  
} catch (error) {
  console.error('Error updating post: ', error);
  return res.status(500).json({error:'Error updating post.'})
}
})

app.delete('/api/posts/:postid', verifyMW.verifyToken, verifyMW.verifyAdmin, async (req, res) => {
  const postId = parseInt(req.params.postid);
  try {
    const post = await database.deletePostById(postId);
    return res.json( { message: 'Post deleted correctly from database.'})
  } catch (error) {
    console.error('Error deleting post from database: ',error);
    return res.status(500).json({error:'Error deleting post.'});
  }
});


// routes for crud operations on comments


app.get('/api/comments', async (req, res) => {
    try {
      const allComments = await database.getAllComments();
      return res.json({allComments});
    } catch (error) {
      console.error('Error fetching comments list', error);
      return res.status(500),json({error:'Error fetching comments'});
    }
});

app.get('/api/posts/:postid/comments', async (req, res) => {
  const postId = parseInt(req.params.postid);
  try {
    const comments = await database.getAllCommentsOfPost(postId);
    return res.json({comments});
  } catch (error) {
    console.error('Error fetching comments list');
    return res.status(500).json({error:'Error fetching comments'});
  }
});



app.post('/api/comments/new/:postid', verifyMW.verifyToken, verifyMW.validateComment, async (req, res) => {
  const postId = parseInt(req.params.postid);
  const userId = req.token.id;
  try {
    const comment = await database.createComment(userId, req.body.text, postId);
    return res.json( { message: 'Comment created successfully', comment: comment});
  } catch (error) {
    console.error('Error creating comment',error);
    return res.status(500).json({error:'Error creating comment'});
  }
});

app.patch('/api/comments/:commentid', verifyMW.verifyToken, verifyMW.verifyAdmin, verifyMW.validateUpdateComment, async (req, res) => {
  const commentId = parseInt(req.params.commentid);
  try {
    const updatedComment = await database.updateComment(commentId, req.body.text);
    return res.json({ message: 'Comment update successfully', comment:updatedComment});
  } catch (error) {
    console.error('Error updating comment',error);
    return res.status(500).json({error:'Error updating comment'});
  }
})

app.delete('/api/comments/:commentid', verifyMW.verifyToken, verifyMW.verifyAdmin, async (req, res) => {
  const commentId = parseInt(req.params.commentid);
  try {
    const comment = await database.deleteCommentById(commentId);
    return res.json({message: 'Comment deleted successfully', comment});
  } catch (error) {
    console.error('Error deleting comment', error);
    return res.status(500).json({error:'Error deleting comment'});
  }
});

app.post('/login', verifyMW.validateLogin, (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: '7 days' }
    );
    return res.json({ token: token });
  })(req,res,next);
});

app.post('/api/admin/login', verifyMW.validateLogin, (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user || user.type !== 'Admin') {
      return res.status(401).json({ message: info.message });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: '1 day' } 
    );
    return res.json({ token: token });
  })(req, res, next);
});

app.post('/register', verifyMW.validateRegistration, async (req, res) => { 
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await database.createUser(req.body, hashedPassword);
    return res.status(200).json({message:'Account created successfully'});
  } catch (error) {
    console.error('Error creating account', error);
    return res.status(500).json({errorMsg:'Error creating account.', error});
  }
});





// Utility function 

function parseEditPostBody(formBody) {
  const updateData = {};
    if (formBody.title) {
      updateData.title = formBody.title;
    }
    if (formBody.text) {
      updateData.text = formBody.text;
    }
    if (formBody.isPublished) {
      const isPub = formBody.isPublished == 'true' ? true : false;
      updateData.isPublished = isPub;
      updateData.createdAt = new Date();
    }

    return updateData;
}



app.listen(8000, () => console.log('Server listening on port 8000'));
