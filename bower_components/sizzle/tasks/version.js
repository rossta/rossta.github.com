"use strict";var exec=require("child_process").exec;module.exports=function(e){e.registerTask("version","Commit a new version",function(i){if(!/\d\.\d+\.\d+(?:-pre)?/.test(i))return void e.fatal("Version must follow semver release format: "+i);var r=this.async(),o=e.config("version.files"),t=/("version":\s*")[^"]+/;o.forEach(function(r){var o=e.file.read(r);o=o.replace(t,"$1"+i),e.file.write(r,o)}),exec("git add -A",function(o){return o?void e.fatal(o):(e.config("pkg.version",i),e.task.run(["build","uglify","dist","commit:'Update version to "+i+"'"]),void r())})})};