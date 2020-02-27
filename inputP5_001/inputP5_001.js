/*
 * @name Mouse Press
 * @description Move the mouse to position the shape.
 * Press the mouse button to invert the color.
 */
function setup() {
  createCanvas(720, 400);
  background(230);
  strokeWeight(5);
}

function draw() {
  
  background(230); 
  if (mouseIsPressed){
    stroke(255);
  }
  else {
    stroke(237,34,93);
  }
  line(mouseX-30, mouseY, mouseX+30, mouseY);
  line(mouseX, mouseY-30, mouseX, mouseY+30);
}
