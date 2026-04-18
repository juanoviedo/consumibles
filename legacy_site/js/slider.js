"use strict";

let elem = document.getElementById("image-show");  // elem points image element to manupulate
let slideIndex = 1;   // Inicialization of variable that moves from 1 to 4
let numPic = 6; // Maximum pectures to slide on

let opInterval; // Opacity timer that manipulates opacity of images
let interval;	 // (timer) Interval of time to slide images
let timeout;   // (timer) incialization of timer variable

showImage(slideIndex); // runs function first time to show firs image

interval = setInterval(function(){ // sets interval to slide images every 5 secons
	slideIndex++;				// sums 1 to slideIndex
	slideIndex = verifyRange(slideIndex, 1, numPic);// verifys that slideIndex is in range (1 to 4 in this case)
	showImage(slideIndex);		// Runs showImage function that changes the image dynamicaly
}, 5000);



function verifyRange (variable, minIndex, maxIndex){ // Verify 1 to 4 range of variable
	if (variable > maxIndex){
		return minIndex;
	}
	if (slideIndex < minIndex){
		return maxIndex;
	}
	return variable;
}

function plusIndex(n){ // function for slider buttons
	slideIndex += n; 	// sums n
	slideIndex = verifyRange(slideIndex, 1, numPic); 				// verifys that slideIndex is in range (1 to 4 in this case)
	showImage(slideIndex); // shows image
	clearInterval(interval); // stop interval timer
	clearTimeout(timeout);		//stop timeout timer
	timeout = setTimeout(function(){  // sets new timeout timer
		interval = setInterval(function(){ // sets new interval timer 
			slideIndex++;					// sums one to show the next image
			slideIndex = verifyRange(slideIndex, 1, numPic);// verifys that slideIndex is in range (1 to 4 in this case)
			showImage(slideIndex);		// runs function that show next image
		}, 5000)
	}, 5000)  // after pressing the button it shows the image 10 seconds and then works automatically again
}

function showImage(n) {
	clearInterval(opInterval); // clears "opacity interval" that manipulates the image opacity

	elem.style.opacity = 0.4; // sets image opacity to 0.4

	elem.src = "{% static 'img/calicivita" + n + ".jpg' %}"; // changes image source

	let opa = 0.4;						// restarts opacity value
	opInterval = setInterval(frame, 10); // sets interval to change opacity each 10 ms

	function frame() {  // function to change opacity until opa >= 1
		if (opa >= 1) {
			elem.style.opacity = 1;
		  	clearInterval(opInterval); // kills op interval
		} else {
		  	opa+=0.01; 
		  	elem.style.opacity = opa; 
		}
	}
}