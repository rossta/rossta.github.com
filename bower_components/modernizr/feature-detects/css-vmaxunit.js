Modernizr.addTest("cssvmaxunit",function(){var t;return Modernizr.testStyles("#modernizr { width: 50vmax; }",function(e,n){var r=window.innerWidth/100,i=window.innerHeight/100,d=parseInt((window.getComputedStyle?getComputedStyle(e,null):e.currentStyle).width,10);t=parseInt(50*Math.max(r,i),10)==d}),t});