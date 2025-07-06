var express = require("express");
const fs = require('node:fs');
const util = require('util');
var app = express();

app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/posts.yml", function(req, res, next) {
  fs.readFile('../blog-posts/posts.yml', 'utf8', (err, data) => {
    console.log('returning file: ' + '\x1b[32m' + '../blog-posts/posts.yml' + '\x1b[0m');
    res.type('text/plain').send(data);
  });
  
});

function loadRegistrationPromptInClipboard(filename, res) {
  fs.readFile('./ai_prompt_registerblogpost.txt', 'utf8', (err, prompt) => {
      //copy the prompt to the clipboard
      prompt = `${filename}` + prompt;
      require('child_process').spawn('clip').stdin.end(prompt);
      console.log(`Registration prompt for ${filename} copied to clipboard!`);
      
      return 201;
  });
}

app.get("/checkForBlogPostConfigUpdate", (req, res, next) => {
  const promise_gitmodifiedmarkdownfiles = new Promise((resolve, reject) => {
    const blogIdsThatNeedUpdatedDate = [];
    const command = 'git status --porcelain';

    require('child_process').exec(command, (error, stdout, stderr) => {
      const newAndEdittedFiles = stdout.split('\n');
      newAndEdittedFiles.forEach(file => {
        if (/^(?! D).*/.test(file)) { // if file is not deleted (does not start with " D")
          if (file.includes('blog-posts/') && file.endsWith('.md')) { // if file is in blog-posts/ and ends with .md
            const blogId = file.substring(3 + 11).slice(0, -3); // remove " M blog-posts/" from the beginning and ".md" from the end
            
            blogIdsThatNeedUpdatedDate.push(blogId);
          }
        }
      });
      
      resolve(blogIdsThatNeedUpdatedDate);
    });
  }); 

  const promise_yaml = new Promise((resolve, reject) => {
    fs.readFile('../blog-posts/posts.yml', 'utf8', (err, yamlFile) => {
      const yamlLines = yamlFile.split('\n');
      resolve(yamlLines);
    });
  }); 

  const promise_listofmarkdownfiles = new Promise((resolve, reject) => {
    fs.readdir('../blog-posts/', (err, files) => {
      if (err) {
          console.error('Error reading directory:', err);
          reject(err);
      }

      var mdFiles = files.filter(file => file.endsWith('.md'));
      resolve(mdFiles);
    });
  });

  Promise.all([promise_gitmodifiedmarkdownfiles, promise_yaml, promise_listofmarkdownfiles])
    .then((values) => {
      const blogIdsThatNeedUpdatedDate = values[0];
      const yamlLines = values[1];
      const mdFiles = values[2];

      let yamlIdArr = [];
      var nextDateNeedsToBeChanged = false;
      var activeId = null;
      var dateWasChanged = false;
      for (let i = 0; i < yamlLines.length; i++) {
        const line = yamlLines[i];
        // Skip empty lines
        if (line.trim() !== '') {
          const [key, ...value] = line.split(':');
          if (key.trim() === 'id') {
            activeId = value.toString().trim();
            yamlIdArr.push(activeId); //unknown what trim does
            if (blogIdsThatNeedUpdatedDate.includes(activeId)) {
              nextDateNeedsToBeChanged = true;
            }
          }
          else if (key.trim() === 'date' && nextDateNeedsToBeChanged) {
            const date = new Intl.DateTimeFormat('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }).format(new Date())
              .replace(/\//g, '-'); // format date as MM-DD-YYYY
              
            console.log(`Changing date for ${activeId} to ${date}`);
            yamlLines[i] = `date: ${date}`;

            dateWasChanged = true;
            nextDateNeedsToBeChanged = false;
          }
        }
      };
      const yamlFileSaved = new Promise((resolve, reject) => {
        if (dateWasChanged) {
          fs.writeFile('../blog-posts/posts.yml', yamlLines.join('\n'), 'utf-8', (err, yamlFile) => {
            resolve();
          });
        }
        else
          resolve();
      });
      
      var returnStatusCode = 500; // default to 500

      var registrationRequired = false;
      mdFiles.forEach(mdFile => {
          //if (file.endsWith('.md')) {
            const id = mdFile.replace('.md', '');
          
            // Check if markdown is registered in yaml
            if (yamlIdArr.includes(id) == false) {
                console.log(`Registration required for: ${mdFile}`);
                registrationRequired = true
                returnStatusCode = loadRegistrationPromptInClipboard(mdFile, res);
            }
          //}
      });

      if (mdFiles.length !== yamlIdArr.length && !registrationRequired) {
          console.error(`Number of md files (${mdFiles.length}) does not match number of IDs in yaml (${yamlIdArr.length})!`);
          returnStatusCode = 400;
      }

      if (!registrationRequired) {
        returnStatusCode = 200;
      }
      else {
        returnStatusCode = 400; // not sure what situation this is for
      }

      yamlFileSaved.then(() => {
        return res.status(returnStatusCode).send();
      });
    });
});

// asks for markdown file
app.get("/:id", function(req, res, next) {
  fs.readFile(`../blog-posts/${req.params.id}`, 'utf8', (err, data) => {
    console.log('returning file: ' + '\x1b[32m' + `../blog-posts/${req.params.id}` + '\x1b[0m');

    /*
    fs.readdir('../blog-posts/', (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }
        files.forEach(file => {
            console.log(file);
        });
    });
    */

    return res.type('text/plain').send(data);
  });
});

app.post("/removeSuggestion", async (req, res, next) => {
  const { id, suggestionText } = req.body;

  var markdown = fs.readFileSync(`../blog-posts/${id}.md`, 'utf-8');

  //const test = 'traditional';
  //const regex = new RegExp(`(\`\!\?)(${suggestionText})\``, 'g');
  //const regex = new RegExp('`!?' + suggestionText + '`', 'g');

  // remove this suggestion from the markdown file
  const escapedText = suggestionText.replace(/'/g, "\\'").replace(/"/g, '\\"'); // escape single and double quotes
  const regexSpecific = new RegExp(`\`\!\\?${escapedText}\``);
  console.log("removing ai suggestion: ", req.body);
  console.log("regex: ", regexSpecific);
  var newMarkdown = markdown.replace(regexSpecific, '');
  fs.writeFileSync(`../blog-posts/${id}.md`, newMarkdown, 'utf-8');

  // check if there are any more ai suggestions in the file
  // if not, create a prompt in the clipboard
  /* 
  const regexAny = new RegExp('\`\!\\?' + '.*' + '\`');
  if (!regexAny.test(newMarkdown)) {
    console.log('no more ai suggestions in this file, creating prompt in clipboard!');

    fs.readFile('./blog-posts/ai_prompt_generatesuggestions.txt', 'utf8', (err, data) => {
      const prompt = `${id}.md` + data;
      require('child_process').spawn('clip').stdin.end(prompt);
      //require('child_process').spawn('clip').stdin.end(('test'));
      
      fs.watch('./blog-posts/watch.txt', { persistent: false }, (curr, prev) => {
          console.log(`File changed!`); // this gets called more and more times (plz fix) (not a big deal)

      });
      

      return res.status(201).send();
    });
  }
  else {
    return res.status(200).send();
  }
  */
  return res.status(200).send();
});

app.get("/noSuggestionsPresent/:id", (req, res, next) => {
  fs.readFile('./ai_prompt_generatesuggestions.txt', 'utf8', (err, data) => {
      const prompt = `${req.params.id}.md` + data;

      //copy the prompt to the clipboard
      require('child_process').spawn('clip').stdin.end(prompt);
      
      return res.status(200).send();
  });
});

var server = app.listen(5000, () => console.log('Example app listening on port 5000!'))
//server.timeout = 1000 * 60 * 10; // 10 minutes