import { config } from './config';

export const htmlPage = (title: string, content: string, styles = '') => (`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="stylesheet" href="https://unpkg.com/axist@latest/dist/axist.min.css" />
      ${styles}
    </head>
    <body>
      ${content}
    </body>
  </html>
`);

export const generateImportDocmapForm = () => htmlPage(
  'Import Docmap',
  `<form action="/import-docmap" method="post">
    <h2>Import Docmap</h2>
    <p>
      <label for="docmap">Docmap:</label>
      <input id="docmap" name="docmap" required/>
    </p>
    <p>
      <label for="temporal_namespace">Select a Namespace:</label>
      <select id="temporal_namespace" name="temporalNamespace" required>
        <option value="" disabled selected hidden>-- Please choose an option --</option>
        ${config.temporalNamespace.split(',').map((ns) => `<option value="${ns}">${ns}</option>`).join('\n')}
      </select>
    </p>
    <p>
      <button type="submit">Submit</button>
    </p>
  </form>`,
);

export const generateManuscriptDataForm = (defaultValue?: string) => htmlPage(
  'Import Manuscript',
  `<form action="/manuscript-data" method="post">
    <h2>Manuscript Data</h2>
    <p>
      <label for="manuscript-data">Input JSON:</label>
      <div><small><em>You can paste directly the result of parseDocmap in any importDocmap workflow</em></small></div>
      <textarea id="manuscript-data" name="manuscript[data]" required style="display: none;">${defaultValue ?? JSON.stringify({
    id: '[ID]',
    versions: [],
  }, undefined, 2)}</textarea>
      <div id="editor-container"></div>
    </p>
    <p>
      <label for="temporal_namespace">Select a Namespace:</label>
      <select id="temporal_namespace" name="temporalNamespace" required>
        <option value="" disabled selected hidden>-- Please choose an option --</option>
        ${config.temporalNamespace.split(',').map((ns) => `<option value="${ns}">${ns}</option>`).join('\n')}
      </select>
    </p>
    <p>
      <label><input type="checkbox" name="purge" value="true"/> Delete before import</label>
    </p>
    <p>
      <label>Tenant ID: 
        <select name="tenant">
          <option>- default -</option>
          <option value="elife">elife</option>
          <option value="biophysics-colab">biophysics-colab</option>
        </select>
      </label>
    </p>
    <p>
      <button type="submit" id="submit-button">Submit</button>
    </p>
  </form>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/edit/matchbrackets.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/edit/closebrackets.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldcode.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldgutter.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/brace-fold.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/indent-fold.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/comment-fold.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/lint/lint.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/lint/json-lint.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/selection/active-line.min.js"></script>
  <script src="https://unpkg.com/jsonlint@1.6.3/web/jsonlint.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const textarea = document.getElementById('manuscript-data');
      
      // Initialize CodeMirror
      const editor = CodeMirror(document.getElementById('editor-container'), {
        value: textarea.value,
        mode: { name: "javascript", json: true },
        theme: "material",
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: false,
        foldGutter: {
          rangeFinder: CodeMirror.fold.brace,
          gutter: "CodeMirror-foldgutter",
          minFoldSize: 1
        },
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
        viewportMargin: Infinity,
        styleActiveLine: true,
        smartIndent: true,
        lint: {
          selfContain: true,
          lintOnChange: true,
          highlightLines: true
        }
      });
      
      // Add focus support for label click
      const label = document.querySelector('label[for="manuscript-data"]');
      if (label) {
        label.addEventListener('click', function(e) {
          e.preventDefault();
          editor.focus();
        });
      }

      // Format the JSON initially with better pretty-printing
      try {
        const initialJson = JSON.parse(textarea.value);
        const formattedJson = JSON.stringify(initialJson, null, 2);
        editor.setValue(formattedJson);
      } catch (e) {
        // If not valid JSON, keep as is
        console.log('Initial JSON parsing failed:', e);
      }
      
      // Function to adjust editor height based on content
      const updateEditorHeight = () => {
        // Get current number of lines
        const lineCount = editor.lineCount();
        // Calculate line height based on a single line (adjusted for larger font and reduced spacing)
        const lineHeight = editor.defaultTextHeight(); // The defaultTextHeight already accounts for font size
        // Set a minimum height (in pixels) plus space for all lines
        const newHeight = Math.max(280, Math.min(window.innerHeight * 0.8, lineHeight * lineCount * 1.2 + 15));
        editor.setSize(null, newHeight);
      };
      
      // Update height initially
      updateEditorHeight();
      
      // Update height when content changes
      editor.on('change', updateEditorHeight);

      // Handle form submission
      document.querySelector('form').addEventListener('submit', function(e) {
        // Get the editor content
        const content = editor.getValue();
        
        try {
          // Validate JSON and format it
          const jsonObj = JSON.parse(content);
          textarea.value = JSON.stringify(jsonObj, null, 2);
        } catch (err) {
          // If it's not valid JSON, show an error and prevent submission
          e.preventDefault();
          alert('Invalid JSON: ' + err.message);
        }
      });

      // Handle paste events
      editor.on('paste', function(cm, e) {
        // We can't cancel CodeMirror's built-in paste handling,
        // so we'll check the value after the next tick
        setTimeout(function() {
          try {
            const content = editor.getValue();
            let jsonObj = JSON.parse(content);
            
            // If the pasted content is an array, extract the first item
            if (Array.isArray(jsonObj) && jsonObj.length > 0) {
              jsonObj = jsonObj[0];
              editor.setValue(JSON.stringify(jsonObj, null, 2));
            } else {
              // Reformat the JSON to ensure proper indentation
              editor.setValue(JSON.stringify(jsonObj, null, 2));
            }
          } catch (err) {
            // If it's not valid JSON, leave it as is
            console.log('Not valid JSON or unable to format:', err);
          }
        }, 0);
      });
    });
  </script>`,
  `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/material.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldgutter.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/lint/lint.min.css">
  <style>
    .CodeMirror {
      min-height: 280px;
      max-height: 80vh;
      width: 90%;
      max-width: 1200px;
      border: 1px solid #444;
      border-radius: 4px;
      font-size: 21px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .CodeMirror-scroll {
      min-height: 280px;
    }
    
    /* Reduce line spacing and ensure alignment */
    .CodeMirror pre.CodeMirror-line,
    .CodeMirror pre.CodeMirror-line-like,
    .CodeMirror-gutter-wrapper,
    .CodeMirror-linenumber {
      padding: 0 4px;
      line-height: 1.3;
    }
    
    /* Fix line number alignment */
    .CodeMirror-linenumber {
      padding-top: 1px;
      text-align: right;
      color: rgba(150, 150, 150, 0.8);
    }
    
    /* Ensure consistent gutter alignment */
    .CodeMirror-gutter-elt {
      height: 1.3em;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    
    /* Style the folding gutter */
    .CodeMirror-foldgutter {
      width: 1.2em;
    }
    
    .CodeMirror-foldgutter-open,
    .CodeMirror-foldgutter-folded {
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #89DDFF;
    }
    
    .CodeMirror-foldgutter-open:after {
      content: "▾";
    }
    
    .CodeMirror-foldgutter-folded:after {
      content: "▸";
    }
    
    /* Ensure the container has enough space */
    #editor-container {
      min-height: 280px;
      width: 90%;
      max-width: 1200px;
    }
    
    /* Improve active line highlighting */
    .CodeMirror-activeline-background {
      background: rgba(0, 0, 0, 0.1);
    }
    
    /* Style matching brackets */
    .CodeMirror-matchingbracket {
      color: #FF9D00 !important;
      font-weight: bold;
      text-shadow: 0 0 3px rgba(255, 157, 0, 0.3);
    }
    
    /* Search dialog styling */
    .CodeMirror-dialog {
      border-bottom: 1px solid #eee;
      background: #f7f7f7;
      padding: 6px;
    }
    
    /* JSON Key-Value styling */
    .cm-property {
      color: #82AAFF;
    }
    
    .cm-string {
      color: #C3E88D;
    }
    
    .cm-number {
      color: #F78C6C;
    }
    
    .cm-atom {
      color: #FF9CAC;
    }
    
  </style>`,
);

export const generateManuscriptDataHelperForm = (versions: number) => htmlPage(
  'Import Manuscript Data - Biophysics Colab only',
  `<h2>Manuscript Data</h2>
  <p><em>Biophysics Colab only (Step 2 of 3)</em></p>
  <form action="/manuscript-data-helper-form" method="post">
    <p>
      <label>MSID: <input type="text" name="msid" required/></label>
    </p>
    ${Array.from({ length: versions }, (_, i) => i).map((version) => (`<fieldset>
      <legend>Version ${version + 1}</legend>
      <p>
        <label>Biorxiv Preprint version: <input type="text" name="versions[${version}][biorxiv]" required/></label>
      </p>
      <p>
        <label>Reviewed Date (YYYY-MM-DD): <input type="text" name="versions[${version}][reviewed]"/></label>
      </p>
      <p>
        <label>Report ID: <input type="text" name="versions[${version}][report]"/></label>
      </p>
      <p>
        <label>Response ID: <input type="text" name="versions[${version}][response]"/></label>
      </p>
      <p>
        <label>Evaluation ID: <input type="text" name="versions[${version}][evaluation]"/></label>
      </p>
      <p>
        <label><input type="checkbox" name="versions[${version}][vor]" value="true"/> VOR</label>
      </p>
    </fieldset>`)).join('')}
    <p>
      <button type="submit">Submit</button>
    </p>
  </form>`,
  `<style>
    fieldset {
      border: 0.1em solid;
      padding: 0.5em;
    }
    
    button {
      margin-top: 1em;
    }
  </style>`,
);
