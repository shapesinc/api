<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Image Generator with Shapes API</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            background: #000;
            color: #fff;
            font-family: Arial, sans-serif;
            padding: 20px;
            text-align: center;
            margin: 0;
        }
        h1 {
            color: #ffcc00;
            font-size: 1.8em;
            margin-bottom: 20px;
        }
        #result {
            margin-top: 20px;
            padding: 10px;
            border: 2px dashed #ffcc00;
            background-color: #111;
            color: #fff;
            display: inline-block;
            max-width: 90%;
            word-wrap: break-word;
            font-size: 1em;
        }
        input[type="text"] {
            padding: 10px;
            width: 80%;
            max-width: 400px;
            border: 1px solid #555;
            border-radius: 8px;
            margin: 10px 0;
            background-color: #222;
            color: #fff;
        }
        button {
            padding: 12px 24px;
            background-color: #ffcc00;
            color: #000;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
            font-size: 1em;
        }
        button:hover {
            background-color: #e6b800;
        }
        footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #888;
        }
        img {
            max-width: 90%;
            height: auto;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <h1>Shape Api Image generator with Prompt Checker</h1>
    <form id="imageForm">
        <input type="text" name="prompt" placeholder="Enter image prompt" required><br><br>
        <button type="submit">Generate Image</button><br><br>
    </form>

    <div id="result">Here will be your generated image</div><br><br>
    <button id="reportButton">Report Issue</button>

    <footer>
        <p>Made by Martysl with Shape API</p>
        <p>This app not allow adult contect if you try you break our policy actualy ai is made that way to be not able to make that content.</p>
    <p>If for some reason you not like image or something not work or image should not be generated raport issue</p>
    </footer>

    <script>
        let lastImageUrl = '';

        document.getElementById('imageForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const prompt = formData.get('prompt');

            // Step 1: Check prompt at promptchecker
            fetch('yoururl/promptchecker.php?prompt=' + encodeURIComponent(prompt))
                .then(response => response.text())
                .then(checkerResponse => {
                    let finalPrompt = prompt;
                    if (checkerResponse.includes('7633362865')) {
                        finalPrompt = 'linux terminal window with text saying blocked';
                    }
                    // Step 2: Send to PHP script with final prompt
                    return fetch('yoururl/image-api.php?prompt=' + encodeURIComponent(finalPrompt));
                })
                .then(response => response.text())
                .then(data => {
                    const resultDiv = document.getElementById('result');
                    if (data.startsWith('http')) {
                        lastImageUrl = data;
                        resultDiv.innerHTML = `<p>Image url: ${data}<br><img src="${data}" alt="Generated Image" style="max-width:300px;"></p>`;
                        document.getElementById('reportButton').style.display = 'inline';
                    } else {
                        resultDiv.innerText = data;
                        lastImageUrl = '';
                        document.getElementById('reportButton').style.display = 'inline';
                    }
                })
                .catch(error => {
                    document.getElementById('result').innerText = 'Error: ' + error;
                });
        });

        document.getElementById('reportButton').addEventListener('click', function() {
            if (lastImageUrl) {
                const subject = encodeURIComponent('Bad Image Report');
                const body = encodeURIComponent(`Hello,\n\nI would like to report a bad image generated by the system:\n\n${lastImageUrl}\n\nThank you.`);
                const email = 'support@easierit.com';
                window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
            } else {
                alert('No image to report.');
            }
        });
    </script>
</body>
</html>
