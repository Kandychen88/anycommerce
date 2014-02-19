
//creates an instance of the template, in memory.
//interpolates all data-tlc on that template.
//returns the template.
var tlc = function(templateid, data)	{
	this.templateid = templateid;
	this.data = data;

//used w/ peg parser for tlc errors.
	this.buildErrorMessage = function(e) {
		return e.line !== undefined && e.column !== undefined ? "Line " + e.line + ", column " + e.column + ": " + e.message : e.message;
		}

	this.createTemplate = function(templateid)	{
		var $tmp = $($._app.u.jqSelector('#',templateid));
		return $._app.model.makeTemplate($tmp,templateid);
		}
	
	this.getTemplateInstance = function(templateid)	{
		var r; //what is returned. either a jquery instance of the template OR false (invalid template)
		if(templateid && $._app.templates[templateid])	{
			r = $._app.templates[templateid].clone(true);
			}
		else if(this.createTemplate(templateid))	{ //createTemplate returns a boolean.
			r = $._app.templates[templateid].clone(true);
			}
		else	{r = false} //invalid template.
		return r;
		}

//This is where the magic happens. Run this and the translated template will be returned.
	this.runTLC = function()	{
		var startTime = new Date().getTime(); // dump("BEGIN runTLC: "+startTime); // ### TESTING -> this is not necessary for deployment.
		
		var _self = this; //'this' context is lost within each loop.
		var $t = _self.getTemplateInstance(_self.templateid);
		if($t)	{
//		dump(" -> running tlcInstance.runTLC. data-tlc.length: "+$("[data-tlc]",$t).length);
			$("[data-tlc]",$t).addBack("[data-tlc]").each(function(index,value){ //addBack ensures the container element of the template parsed if it has a tlc.
				var $tag = $(this), tlc = $tag.data('tlc');
//			dump("----------------> start new $tag <-----------------");
				var commands = false;
				try{
					commands = window.pegParser.parse(tlc);
					}
				catch(e)	{
					dump(self.buildErrorMessage(e));
					}
	
				if(commands && !$.isEmptyObject(commands))	{
					_self.executeCommands(commands,{
						tags : {
							'$tag' : $tag
							}, //an object of tags.
						focusTag : '$tag' //the pointer to the tag that is currently in focus.
						});
					}
				else	{
					dump("couldn't parse a tlc",'warn');
					//could not parse tlc. error already reported.
					}
	//			dump("----------------> end $tag <-----------------");
				});
			}
		else	{
			//invalid template
			}
		dump("END runTLC: "+(new Date().getTime() - startTime)+" milliseconds");
		return $t;
		} //runTLC

//used in 'apply' and possibly elsewhere. changes the args arrays into a single object for easy lookup.
	this.args2obj = function(args)	{
		var r = {};
		for(var i = 0, L = args.length; i < L; i += 1)	{
			r[args[i].key] = (args[i].value == null) ? true : args[i].value; //some keys, like append or media, have no value and will be set to null.
			}
		return r;
		}

//The vars object should match up to what the attributes are on the image tag. It means the object used to create this instance can also be passed directly into a .attr()
	this.makeImageURL	= function(vars)	{
		if(vars['data-bgcolor'].charAt(0) == '#')	{vars['data-bgcolor'] = vars['data-bgcolor'].substr(1)}
		var url = (vars.width ? "-W"+vars.width : "")+(vars.height ? "-H"+vars.height : "")+(vars['data-bgcolor'] ? "-B"+vars['data-bgcolor'] : "")+(vars['data-minimal'] ? "-M" : "")+"/"+vars['data-filename']
		//don't want the first character to be a -. all params are optional, stripping first char is the most efficient way to build the path.
		return "http://www.sporks.zoovy.com/media/img/-/"+url.substr(1); //### TODO -> obviously, we don't want sporks info in URL.
		}

/*
This should return an img tag OR the url, based on whether the formatter is img or imageurl
'media' -> generate a media library instance for the var passed.
'src' -> use the value passed (/some/image/path.jpg)
The tag passed in will either be focusTag OR the $tag passed in.
	-> here, the tag can be used for read only purposes. The 'verb' handles updating the tag.
if neither media or src, something is amiss.
This one block should get called for both img and imageurl but obviously, imageurl only returns the url.
*/
	this.apply_formatter_img = function(formatter,$tag,argObj,globals)	{
		var r = true,filePath;
		argObj.media = argObj.media || {};
		var mediaParams;
		if(argObj.media.type == 'variable' && globals.binds[argObj.media.value])	{
			//build filepath for media lib
			//default = true is use focusTag. default = $tag says to use another, already defined, tag so focus shifts within this function, but focusTag does NOT change.
			if(typeof argObj.default === 'string')	{
				if(globals.tags[argObj.default])	{
					$tag = globals.tags[argObj.default]
					}
				else	{
					dump("Formatter img/imageurl specified "+argObj.default+" as the tag src, but that tag has not been defined",'warn');
					}
				}

			if(argObj.default)	{
				dump(" -> use attributes of tag to build image path");
				//here need to check if default is set to a tag. not sure how, docs are not specific.
				if($tag.is('img'))	{
					mediaParams = {'width':$tag.attr('width'),'height':$tag.attr('height'),'data-bgcolor':$tag.data('bgcolor'),'data-minimal':$tag.data('minimal'),'data-filename':globals.binds[argObj.media]};
					filePath = this.makeImageURL(mediaParams);
					}
				else	{
					r = false;
					//the command to pull attributes from the tag is invalid because the tag isn't an image.
					}
				}
			else	{
				mediaParams = {'width':argObj.width.value,'height':argObj.height.value,'data-bgcolor':argObj.bgcolor.value,'data-minimal':(argObj.minimal ? argObj.minimal.value : 0),'data-filename':globals.binds[argObj.media.value]};
				filePath = this.makeImageURL(mediaParams);
				}
			}
		else if(argObj.src && argObj.src.value)	{
			//do nothing here, but is valid (don't get into 'else' error handling).
			}
		else	{
			r = false;
			//either media or src left blank. OR media is tru and the var specified doesn't exist.
			dump("Something was missing for apply_img.\if media.type == 'variable' then globals.binds[argObj.media.value] must be set.\nor src ["+argObj.src+"] not specified on appy img OR media is set but globals.binds["+argObj.media+"] ["+globals.binds[argObj.media]+"} is not.");
			}

		if(filePath && formatter == 'img')	{
			var $tmp = $("<div \/>").append($("<img \/>").attr(mediaParams).attr('src',filePath));
			r = $tmp.html();
			}
		else if(filePath)	{
			r = filePath;
			}
		else	{} //some error occured. should have already been written to console by now.

		return r;
		}
	
	this.apply_verb_select = function($tag,argObj,globals)	{
		var dataValue = globals.binds[globals.focusBind]; //shortcut.
		if($tag.is(':checkbox'))	{
			if(dataValue == "" || Number(dataValue) === 0)	{
				$tag.prop({'checked':false,'defaultChecked':false}); //have to handle unchecking in case checked=checked when template created.
				}
			else	{
//the value here could be checked, on, 1 or some other string. if the value is set (and we won't get this far if it isn't), check the box.
				$tag.prop({'checked':true,'defaultChecked':true});
				}
			}
		else if($tag.is(':radio'))	{
//with radio's the value passed will only match one of the radios in that group, so compare the two and if a match, check it.
			if($tag.val() == dataValue)	{$tag.prop({'checked':true,'defaultChecked':true})}
			}
		else if($tag.is('select') && $tag.attr('multiple') == 'multiple')	{
			if(typeof dataValue === 'object')	{
				var L = dataValue.length;
				for(var i = 0; i < L; i += 1)	{
					$('option[value="' + dataValue[i] + '"]',$tag).prop({'selected':'selected','defaultSelected':true});
					}
				}
			}
		else	{
			$tag.val(dataValue);
			$tag.prop('defaultValue',dataValue); //allows for tracking the difference onblur.
			}
		}

	this.handle_apply_verb = function(verb,$tag,argObj,globals){
		switch(verb)	{
//new Array('empty','hide','show','add','remove','prepend','append','replace','input-value','select','state','attrib'),
			case 'empty': $tag.empty(); break;
			case 'hide': $tag.hide(); break;
			case 'show': $tag.show(); break;

			//add and remove work w/ either 'tag' or 'class'.
			case 'add' : 
				if(argObj.class)	{$tag.addClass(argObj.class)}
				else if(argObj.tag)	{
					// ### TODO -> not done yet. what to do? add a tag? what tag? where does it come from?
					}
				break; 
			case 'remove':
				if(argObj.class)	{$tag.removeClass(argObj.class)}
				else if(argObj.tag)	{
					$tag.remove();
					}
				else	{
					dump("For apply, the verb was set to remove, but neither a tag or class were defined. argObj follows:",'warn'); dump(argObj);
					}
				break; 
			
			case 'prepend': $tag.prepend(globals.binds[globals.focusBind]); break;
			case 'append': $tag.append(globals.binds[globals.focusBind]); break;
			case 'replace': $tag.replaceWith(globals.binds[globals.focusBind]); break;
			case 'input-value':
				$tag.val(globals.binds[globals.focusBind]);
				break;
			case 'select' :
				this.apply_verb_select($tag,argObj,globals); //will modify $tag.
				break;
			case 'state' :
				// ### TODO -> not done yet.
				break;  
			case 'attrib':
				$tag.attr(argObj.attrib.value,globals.binds[globals.focusBind]);
				break;
			}
		}

	this.handle_apply_formatter = function(formatter,$tag,argObj,globals)	{
		switch(formatter)	{
			case 'text':
				if(globals.binds[argObj.text])	{
					var $tmp = $("<div>").append(globals.binds[argObj.text]);
					globals.binds[argObj.text] = $tmp.text();
					globals.focusBind = argObj.text;
					}
				else	{
					dump("For command "+cmd+" formatter set to text but scalar passed is not defined in globals.binds",'warn');
					}
				break;
			case 'html':
				globals.focusBind = argObj.html;
				break;
			case 'img':
				globals.binds[globals.focusBind] = this.apply_formatter_img(formatter,$tag,argObj,globals);
				break;
			case 'imageurl':
				globals.binds[globals.focusBind] = this.apply_formatter_img(formatter,$tag,argObj,globals); //function returns an image url
				break;
			}
		}

	this.comparison = function(op,p1,p2)	{
		var r = false;
		switch(op)	{
			case "eq":
				if(p1 == p2){ r = true;} break;
			case "ne":
				if(p1 != p2){ r = true;} break;
			case "gt":
				if(Number(p1) > Number(p2)){r = true;} break;
			case "lt":
				if(Number(p1) < Number(p2)){r = true;} break;
			case "true":
				if(p1){r = true;}; break;
			case "false":
				if(!p1){r = true;}; break;
			case "blank":
				if(p1 == ''){r = true;}; break;
			case "notblank":
				if(!p1 || p1 == 0){r = true;}; break; //==, not ===, because zero could be passed in as a string.
			case "null":
				if(p1 == null){r = true;}; break;
			case "notnull":
				if(p1 != null){r = true;}; break;
			case "regex":
				var regex = new RegExp(p2);
				if(regex.exec(p1))	{r = true;}
				break;
			case "notregex":
				var regex = new RegExp(p2);
				if(!regex.exec(p1))	{r = true;}
				break;
// and/or allow commands to be chained.
//--and (FUTURE) -> this is for chaining, so if and is present, 1 false = IsFalse.
//--or (FUTURE) -> this is for chaining, so if and is present, 1 true = IsTrue.
/*			case "and":
				if(p1 != null){r = true;}; break; // ### FUTURE -> not done
			case "or":
				if(p1 != null){r = true;}; break; // ### FUTURE -> not done.
*/			}
		return r;
		}



/* //////////////////////////////     FORMATS	 \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */

//passing the command into this will verify that the format exists (whether it be core or not)

	this.format_currency = function(arg,globals)	{
		var r = "$"+globals.binds[globals.focusBind]+" ("+arg.value.value+")";
		globals.binds[globals.focusBind] = r
		return r;
		} //currency
	this.format_prepend = function(arg,globals)	{
		var r = arg.value.value+globals.binds[globals.focusBind];
		globals.binds[globals.focusBind] = r
		return r;
		} //prepend
	this.format_append = function(arg,globals)	{
		var r = globals.binds[globals.focusBind]+arg.value.value;
		globals.binds[globals.focusBind] = r
		return r;
		} //append
	this.format_truncate = function(arg,globals)	{
		var
			r = globals.binds[globals.focusBind].toString(), //what is returned. Either original value passed in or a truncated version of it.
			len = arg.value.value;
		if(!len || isNaN(len)){}
		else if(r.length <= len){}
		else	{
			if (r.length > len) {
				r = r.substring(0, len); //Truncate the content of the string
				r = $.trim(r.replace(/\w+$/, '')); //go back to the end of the previous word to ensure that we don't truncate in the middle of a word. trim trailing whitespace.
				r += '&#8230;'; //Add an ellipses to the end
				globals.binds[globals.focusBind] = r;
				}
			}
		return r;
		} //truncate
	this.format_uriencode = function(arg,globals)	{
		var r = encodeURI(globals.binds[globals.focusBind]);
		globals.binds[globals.focusBind] = r
		return r;
		} //truncate


	this.format_from_module = function(cmd,globals)	{
//		dump(" -> non 'core' based format. not handled yet"); // dump(' -> cmd'); dump(cmd); dump(' -> globals'); dump(globals);
		var moduleFormats;

		if(cmd.module == 'controller')	{
			moduleFormats = $._app.tlcFormats
			}
		else if($._app.ext[cmd.module] && $._app.ext[cmd.module].tlcFormats)	{
			moduleFormats = $._app.ext[cmd.module].tlcFormats;
			}
		else	{}

		if(moduleFormats && typeof moduleFormats[cmd.name] === 'function')	{
			moduleFormats[cmd.name](globals.tags[globals.focusTag],{'command':cmd,'globals':globals},this);// probably want the first param to be the tag.
			}

		}



/* //////////////////////////////     TYPE HANDLERS		 \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */

/*
There are a few 'types' that can be specified:
BIND (setting a var)
IF (conditional logic) 
Block (set for the statements inside an IF IsTrue or IsFalse). contains an array of statements.
command (everything else that's supported).
*/

	this.handleType_command = function(cmd,globals)	{
		dump(" -> cmd.name: "+cmd.name); //dump(cmd);
		try{
			if(cmd.module == 'core')	{
				this['handleCommand_'+cmd.name](cmd,globals)
				}
			else	{
				this.format_from_module(cmd,globals);
				}
			}
		catch(e){
			dump(e);
			dump(cmd);
			}
		}

	this.handleType_BIND = function(cmd,globals)	{
//		dump("Now we bind"); dump(cmd);
		//scalar type means get the value out of the data object.
		globals.binds[cmd.Set.value] = (cmd.Src.type == 'scalar') ? jsonPath(this.data, '$'+cmd.Src.value) : cmd.Src.value;
		globals.focusBind = cmd.Set.value; // dump(" -> globals.focusBind: "+globals.focusBind);
		return cmd.Set.value;
		}
	
	this.handleType_IF = function(cmd,globals)	{
//		dump("BEGIN handleIF"); dump(cmd);
		var p1; //first param for comparison.
		var args = cmd.When.args;
		var action = 'IsTrue'; //will be set to false on first false (which exits loop);
		//NOTE -> change '2' to args.length to support multiple args. ex: if (is $var --lt='100' --gt='5') {{ apply --append; }};
		for(var i = 0, L = 2; i < L; i += 1)	{
			if(args[i].type == 'variable')	{
				p1 = globals.binds[args[i].value];
				}
			else	{
				if(this.comparison(args[i].key,p1,(args[i].value && args[i].value) ? args[i].value.value : null))	{}
				else {
					action = 'IsFalse';
					break;
					}
				}
			}
		if(cmd[action])	{
//			dump(' -> cmd[action]'); dump(cmd[action].statements[0]);
			for(var i = 0, L = cmd[action].statements[0].length; i < L; i += 1)	{
				this.executeCommands(cmd[action].statements[0][i],globals); // ### TODO -> the statements are being returned nested 1 level deep in an otherwise empty array. bug.
				}
			
			}
		else	{} //would get here if NOT true, but no isFalse was set. I guess technically you could also get here if isTrue and no isTrue set.
		return (action == 'isTrue' ? true : false);
		}

	


/* //////////////////////////////     COMMAND HANDLERS		 \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */

	this.handleCommand_format = function(cmd,globals)	{
		var format = cmd.args[0].key, r;
//		dump(' -> cmd: '); dump(cmd);
		if(cmd.module == 'core' && this['format_'+format])	{
			for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
				try	{
					this['format_'+cmd.args[i].key](cmd.args[i],globals);
					}
				catch(e)	{}
				}
			}
		else	{
			dump(" -> invalid core  format specified.",'warn');
			//invalid format specified.
			}
		return r;
		}

//passing the command into this will verify that the apply exists (whether it be core or not)
//may be able to merge this with the handleCommand_format. We'll see after the two are done and if the params passed into the functions are the same or no.
// NOTE -> stopped on 'apply' for now. B is going to change the way the grammer hands back the response. Once he does that, I'll need to flatten the array into a hash to easily test if 'empty' or some other verb is set.
	this.handleCommand_apply = function(cmd,globals)	{
		dump(" -> BEGIN handleCommand_apply");// dump(cmd);
		var r = true;
		if(cmd.module == 'core')	{
			var
				verbs = new Array('empty','hide','show','add','remove','prepend','append','replace','input-value','select','state','attrib'),
				formatters = new Array('img','imageurl','text','html'),
				argObj = this.args2obj(cmd.args), //an object is used to easily check if specific apply commands are present
				$tag = globals.tags[(argObj.tag || globals.focusTag)],
				numVerbs = 0, numFormatters = 0, theVerb = null, theFormatter = null;

			//count the number of verbs.  Only 1 is allowed.
			for(var index in argObj)	{
				if($.inArray(index,verbs) >= 0)	{
					theVerb = index;
					numVerbs++;
					}
				else if($.inArray(index,formatters) >= 0)	{
					theFormatter = index;
					numFormatters++;
					}
				else	{
					//okay to get here. likely just some argument for the verb or formatter
					}
				}
			
//			dump("numVerbs: "+numVerbs+" theVerb: "+theVerb+" theFormat: "+theFormatter+" numFormats: "+numFormatters);
			//formatter is optional, but only 1 can be specified.
			if(numVerbs === 1 && numFormatters <= 1)	{

				if(theFormatter)	{
//					dump(" -> a formatter ["+theFormatter+"] is set. process that first.");
					this.handle_apply_formatter(theFormatter,$tag,argObj,globals);
					}
				
				this.handle_apply_verb(theVerb,$tag,argObj,globals);

				}
			else if(numVerbs === 0)	{
				dump("For command: "+cmd+" no verb was specified on the apply. Exactly 1 verb must be specified.",'warn');
				}
			else	{
				dump("For command (below) either more than 1 verb or more than 1 formatter was specified on the apply. Exactly 1 of each is allowed per command.",'warn');
				dump(cmd);
				}

			}
		else if(cmd.module && cmd.module.indexOf('#') >= 0)	{
			dump(" -> non 'core' based apply. not handled yet");
			//use format in extension.
			}
		else	{
			dump(" -> invalid core apply specified");
			r = false;
			//invalid format specified.
			}
		return r;
		}

	
	this.handleCommand_render = function(cmd,globals){
		var r, argObj = this.args2obj(cmd.args); //an object is used to easily check if specific apply commands are present
//		dump(" -> cmd: "); dump(cmd);
		if(argObj.wiki)	{
			var $tmp = $("<div>").append(value);
			//r = wikify($tmp.text()); //###TODO -> 
			globals.binds[cmd.Set.value] = $tmp.text();
			}
		else if(argObj.html)	{
			r = value; //if the content is already html, shouldn't have to do anything to it.
			}
		else if(argObj.dwiw)	{
			// ###TODO -> need to determine if content is wiki or html.
			r = value;
			}
		else	{
			//unrecognized command.
			r = value;
			}
		return r;
		}
		
	this.handleCommand_stringify = function(cmd,globals)	{
		globals.binds[globals.focusBind] = JSON.stringify(globals.binds[globals.focusBind])
		return globals.binds[globals.focusBind];
		}

	this.handleCommand_transmogrify = function(cmd,globals)	{
//		dump(" ->>>>>>> templateid: "+cmd.args[0].value); //dump(this.args2obj(cmd.args));
		var tmp = new tlc(cmd.args[0].value,this.data);
		globals.tags[globals.focusTag].append(tmp.runTLC());
		//this will backically instantate a new tlc (or whatever it's called)
		}

	this.handleCommand_is = function(cmd,globals)	{
		var value = globals.binds[globals.focusBind], r = false;
		for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
			value = this.comparison(cmd.args[i].key,value,cmd.args[i].value.value);
			}
		globals.binds[globals.focusBind] = value;
		return value;
		}

	this.handleCommand_math = function(cmd,globals)	{
		var value = Number(globals.binds[globals.focusBind]);
		if(!isNaN(value))	{
			for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
				switch(cmd.args[i].key)	{
					case "add":
						value += cmd.args[i].value.value; break;
					case "sub":
						value -= cmd.args[i].value.value; break;
					case "mult":
						value *= cmd.args[i].value.value; break;
					case "div":
						value /= cmd.args[i].value.value; break;
					case "precision":
						value = value.toFixed(cmd.args[i].value.value); break;
					case "percent":
						value = (value/100).toFixed(0); break;
					}
				}
			globals.binds[globals.focusBind] = value;
			}
		else	{
			dump(" -> handleCommand_math was run on a value ["+globals.binds[globals.focusBind]+" which is not a number.");
			}
		return value;
		}

	this.handleCommand_datetime = function(cmd,globals)	{

		var value = globals.binds[globals.focusBind];
		var argObj = this.args2obj(cmd.args), d = new Date(value*1000);


		if(isNaN(d.getMonth()+1))	{
			dump("In handleCommand_datetime, value ["+value+"] is not a valid time format for Date()",'warn');
			}
//### FUTURE
//		else if(argObj.out-strftime)	{}
		else if (argObj.out.value == 'pretty')	{
			var shortMon = new Array('Jan','Feb','Mar','Apr','May','June','July','Aug','Sep','Oct','Nov','Dec');
			value = (shortMon[d.getMonth()])+" "+d.getDate()+" "+d.getFullYear()+ " "+d.getHours()+":"+((d.getMinutes()<10?'0':'') + d.getMinutes());
			}
		else if(argObj.out.value == 'mdy')	{
			value = (d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear();
			}
		else	{
			//invalid or no 'out' specified.
			}
		globals.binds[globals.focusBind] = value;
		return value;
		}


//can be triggered by runTLC OR by handleType_Block.
	this.executeCommands = function(commands,globals)	{
//		dump(" -> running tlcInstance.executeCommands"); // dump(commands);
		//make sure all the globals are defined. whatever is passed in will overwrite the defaults. that happens w/ transmogrify
		var theseGlobals = $.extend(true,{
			binds : {}, //an object of all the binds set in args.
			tags : {
				'$tag' : ''
				}, //an object of tags.
			focusBind : '', //the pointer to binds of the var currently in focus.
			focusTag : '$tag' //the pointer to the tag that is currently in focus.
			},globals);

		for(var i = 0, L = commands.length; i < L; i += 1)	{
//			dump(i+") commands[i]: handleCommand_"+commands[i].type); //dump(commands[i]);
			if(commands[i].type == 'command')	{
				this.handleType_command(commands[i],theseGlobals);
				}
			else if(commands[i].type == 'IF')	{
				this['handleType_IF'](commands[i],theseGlobals);
				}
			else if(commands[i].type == 'BIND')	{
				this['handleType_BIND'](commands[i],theseGlobals);
				}
			else	{
				//unrecognized type.
				}

			}
		}
	}