var exec  = require('child_process').exec;
var fs = require('fs');
var cuid = require('cuid');
var colors = require('colors');


exports.stats = false ;


exports.compileCPP = function ( envData ,  code , fn ) { 
			//creating source file
	        var filename = cuid.slug();
			path = './temp/';
			 			 

			//create temp0 
 			fs.writeFile( path  +  filename +'.cpp' , code  , function(err ){			
					if(exports.stats)
					{
						if(err)
						console.log('ERROR: '.red + err);
					    else
					    {
					    console.log('INFO: '.green + filename +'.cpp created');	
	 					//compiling and exrcuiting source code
					       if(envData.cmd === 'g++')
					       {
							   //compile c code
							   commmand = 'g++ ' + path + filename +'.cpp -o '+ path + filename+'.exe' ;
							   exec(commmand , function ( error , stdout , stderr ){
								   if(error)
								   {
									   if(exports.stats)
									   {
										   console.log('INFO: '.green + filename + '.cpp contained an error while compiling');
									   }
									   var out = { error : stderr};
									   fn(out);
								   }
								   else
								   {
									   exec( path + filename + '.out', function ( error , stdout , stderr ){
										   if(error)
										   {
											   if(error.toString().indexOf('Error: stdout maxBuffer exceeded.') != -1)
											   {
												   var out = { error : 'Error: stdout maxBuffer exceeded. You might have initialized an infinite loop.' };
												   fn(out);
											   }
											   else
											   {
												   if(exports.stats)
												   {
													   console.log('INFO: '.green + filename + '.cpp contained an error while executing');
												   }
												   var out = { error : stderr };
												   fn(out);
											   }
										   }
										   else
										   {
											   if(exports.stats)
											   {
												   console.log('INFO: '.green + filename + '.cpp successfully compiled and executed !');
											   }
											   var out = { output : stdout};
											   fn(out);
										   }
									   });

								   }
							   });
					       }  
					       else if(envData.cmd === 'gcc')
					       {
							//compile c code 
							commmand = 'gcc ' + path + filename +'.cpp -o '+ path + filename+'.out' ;
							exec(commmand , function ( error , stdout , stderr ){  
								if(error)
								{
									if(exports.stats)
									{
										console.log('INFO: '.green + filename + '.cpp contained an error while compiling');
									}
									var out = { error : stderr};
									fn(out);
								}
								else
								{
									exec( path + filename + '.out', function ( error , stdout , stderr ){
										if(error)
										{
										if(error.toString().indexOf('Error: stdout maxBuffer exceeded.') != -1)
											{
												var out = { error : 'Error: stdout maxBuffer exceeded. You might have initialized an infinite loop.' };
												fn(out);
											}
										else
											{
												if(exports.stats)
													{
														console.log('INFO: '.green + filename + '.cpp contained an error while executing');
													}
												var out = { error : stderr };
												fn(out);
											}													
										}
										else
										{
											if(exports.stats)
											{
												console.log('INFO: '.green + filename + '.cpp successfully compiled and executed !');
											}
											var out = { output : stdout};
											fn(out);
										}
						    		});

								}			
							});
					       }	
					       else
					       {
					       	console.log('ERROR: '.red + 'choose either g++ or gcc ');
					       }				    	
						}	//end of else part of err
					}	//end of expors.stats			
				}); //end of write file 

    								
} //end of compileCPP

exports.compileCPPWithInput = function ( envData , code , input ,  fn ) { 
	var filename = cuid.slug();
	path = './temp/';
	 			 
	//create temp0 
 	fs.writeFile( path  +  filename +'.cpp' , code  , function(err ){
 		if(exports.stats)
	    {
			if(err)
				console.log('ERROR: '.red + err);
	    	else
	    	{
				console.log('INFO: '.green + filename +'.cpp created');
				if(envData.cmd ==='g++')
				    {

						commmand = 'g++ ' + path + filename +'.cpp -o '+ path + filename+'.exe' ;
						exec(commmand , function ( error , stdout , stderr ){
							if(error)
							{
								if(exports.stats)
								{
									console.log('INFO: '.green + filename + '.cpp contained an error while compiling');
								}
								var out = { error : stderr};
								fn(out);
							}
							else
							{
								console.log("INFO: ".green + "compiled a cpp file");
								var out = {message :  'compiled',path : filename };
								fn(out);
							}
						});
				    								
				    }
				else if ( envData.cmd == 'gcc')	    	
				    {
				    				//compile c code 
						commmand = 'gcc ' + path + filename +'.cpp -o '+ path + filename+'.out' ;
						exec(commmand , function ( error , stdout , stderr ){  
							if(error)
							{
								if(exports.stats)
								{
									console.log('INFO: '.green + filename + '.cpp contained an error while compiling');
								}
								var out = { error : stderr};
								fn(out);
							}
							else
							{
								console.log("INFO: ".green + "compiled a cpp file");
								var out = {message :  'compiled',path : filename };
								fn(out);
							}			
						});
				}	
				else
				{
				   	console.log('ERROR: '.red + 'choose either g++ or gcc ');
				}		    	
	    	}	//end of else err	    	
		}	//end of exports.stats
	});	//end of write file 							
} //end of compileCPPWithInput
exports.runCppWithInput = function (envData , filename , input , fn ){
	if(input){
		var path = './temp/';
		var inputfile = filename + 'input.txt';

		fs.writeFile( path  +  inputfile , input  , function(err ){
			if(exports.stats)
			{
				if(err)
					console.log('ERROR: '.red + err);
				else
					console.log('INFO: '.green + inputfile +' (inputfile) created');
			}
		});

		exec( path + filename +'.exe < ' + path + inputfile , function( error , stdout , stderr ){
			if(error)
			{

				if(error.toString().indexOf('Error: stdout maxBuffer exceeded.') != -1)
				{
					var out = { error : 'Error: stdout maxBuffer exceeded. You might have initialized an infinite loop.'};
					fn(out);
				}
				else
				{
					if(exports.stats)
					{
						console.log('INFO: '.green + filename + '.exe contained an error while executing');
					}
					var out =  { output : stderr};
					fn(out);
				}
			}
			else
			{
				if(exports.stats)
				{
					console.log('INFO: '.green + filename + '.exe successfully executed !');
				}
				var out = {message: 'success', output: stdout};
				fn(out);
			}
		});

	}
	else //no input file
	{
		if(exports.stats)
		{
			console.log('INFO: '.green + 'Input mission for '+filename +'.cpp');
		}
		var out = { error : 'Input Missing' };
		fn(out);
	}
}
