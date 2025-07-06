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
    console.log('returning file: ../blog-posts/posts.yml');
    res.type('text/plain').send(data);
  });
  
});

function loadRegistrationPrompt(filename, res) {
  fs.readFile('./ai_prompt_registerblogpost.txt', 'utf8', (err, prompt) => {
      //copy the prompt to the clipboard
      prompt = `${filename}` + prompt;
      require('child_process').spawn('clip').stdin.end(prompt);
      console.log(`Registration prompt for ${filename} copied to clipboard!`);
      
      return res.status(201).send();
  });
}

app.get("/checkForBlogPostConfigUpdate", (req, res, next) => {
  var configUpdateRequired = false;

  fs.readFile('../blog-posts/posts.yml', 'utf8', (err, yamlFile) => {

    const yamlLines = yamlFile.split('\n');
    let yamlIdArr = [];
    yamlLines.forEach(line => {
      // Skip empty lines
      if (line.trim() !== '') {
        const [key, ...value] = line.split(':');
        if (key.trim() === 'id') {
          yamlIdArr.push(value.toString().trim()); //unknown what trim does
        }
      }
    });

    var registrationRequired = false;
    fs.readdir('../blog-posts/', (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(400).send();
        }

        var mdFiles = files.filter(file => file.endsWith('.md'));
        mdFiles.forEach(mdFile => {
            //if (file.endsWith('.md')) {
              const id = mdFile.replace('.md', '');
            
              if (yamlIdArr.includes(id) == false) {
                  console.log(`Registration required for: ${mdFile}`);
                  registrationRequired = true
                  return loadRegistrationPrompt(mdFile, res);
              }
            //}
        });

        if (mdFiles.length !== yamlIdArr.length && !registrationRequired) {
            console.error(`Number of md files (${mdFiles.length}) does not match number of IDs in yaml (${yamlIdArr.length})!`);
            return res.status(400).send();
        }

        if (!registrationRequired) {
          return res.status(200).send();
        }
    });
  });
});

// asks for markdown file
app.get("/:id", function(req, res, next) {
  fs.readFile(`../blog-posts/${req.params.id}`, 'utf8', (err, data) => {
    console.log('returning file: ../blog-posts/', req.params.id);

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