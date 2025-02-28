# Absorbance-Vis-Tool

Allows easy visualization of absorbance csv files created by the BioComp Triax.

## Summary

The purpose of the data visualization tool is to create a basic line graph of the absorbance of gradient samples over time. The tool should be intuitive and visually appealing. Hosting the tool on a webpage will allow for users to have personal accounts to keep track of past results. The tool will be implemented using React and D3 for maximum flexibility in the visualization.

## Considerations

- How will the database store user preferences?
- What database should be used?
- How do react and d3 work together?
- What is Expression Engine and do react and Expression Engine work together?
- What is the privacy policy for the website? Do we need to worry about protecting data visualizations from user to user?
- What is the layout of the webpage?
- Tailwind CSS vs SASS?
- What hosting services should be used (Vercel, Heroku, Render, Railway, Docker, Kubernetes)?

## Libraries, Languages, and Tools

This project will use React (also Redux for state management and possibly React Query for retrieving data from Mongo DB), D3, and Tailwind CSS for the front end and MongoDB with Node.js for the back end. Other tools to consider are Postman, Swagger, and Open API for building an API design.

### React

React is a popular modern framework for web applications. It has plenty of documentation and resources to learn about online. React allows you to create more modular web applications because of its “component” features. Components are pieces of code that create html elements dynamically. This also can be done with plain javascript but takes longer to code and has some major setbacks. Predominantly, the whole webpage must be reloaded when changing an element. React allows only the elements that will be affected by the change to be reloaded resulting in a smoother and more efficient transition.

### Tailwind CSS

Tailwind CSS is a framework for CSS (Cascading Style Sheets) designed to standardize and enhance webpage styling. Tailwind gives a web designer a large toolbox of CSS styles that can be used to quickly create visually appealing webpages. It reduces the amount of time spent thinking and fixing errors when styling. This way, the coder can focus on making the webpage look good rather than trying to work through bugs.

### D3

D3 is a powerful tool for creating data visualizations on a browser application.
