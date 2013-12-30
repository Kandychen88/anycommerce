/* **************************************************************

   Copyright 2013 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.



************************************************************** */
//SCO = Shared Checkout Object
var cco = function() {
	var r = {
					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		

/*
unlike other extensions, checkout calls rarely do a 'fetchData'. The thought here is to make sure we always have the most recent data.
calls should always return the number of dispatches needed. allows for cancelling a dispatchThis if not needed.
   so in most of these, a hard return of 1 is set.

*/
	calls : {

//formerly getCheckoutDestinations
		appCheckoutDestinations : {
			init : function(cartID,_tag,Q)	{
				var r = 0;
				if(cartID)	{
					this.dispatch(cartID,_tag,Q);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cco.calls.appCheckoutDestinations, cartID not passed and is required.","gMessage":true});
					}
				return r;
				},
			dispatch : function(cartID,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = 'appCheckoutDestinations|'+cartID;
				app.model.addDispatchToQ({"_cmd":"appCheckoutDestinations","_tag": _tag,"_cartid":cartID},Q || 'immutable');
				}
			}, //appCheckoutDestinations

		appPaymentMethods : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj._cartid)	{
				app.u.dump(" -> appPaymentMethods cartID: "+obj._cartid);
					this.dispatch(obj,_tag,Q); //obj could contain country (as countrycode) and order total.
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cco.calls.appPaymentMethods, obj._cartid was not passed and is required.","gMessage":true});
					}
				
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appPaymentMethods";
				obj._tag = _tag || {};
				obj._tag.datapointer = 'appPaymentMethods|'+obj._cartid;
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //appPaymentMethods

		cartCouponAdd : {
			init : function(coupon,_tag,Q)	{
				this.dispatch(coupon,_tag,Q);
				},
			dispatch : function(coupon,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"cartCouponAdd","coupon":coupon,"_tag" : _tag},Q || 'immutable');	
				}			
			}, //cartCouponAdd

		cartGiftcardAdd : {
			init : function(giftcard,_tag,Q)	{
				this.dispatch(giftcard,_tag,Q);
				},
			dispatch : function(giftcard,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"cartGiftcardAdd","giftcard":giftcard,"_tag" : _tag},Q || 'immutable');	
				}			
			}, //cartGiftcardAdd

//can be used to verify the items in the cart have inventory available.
		cartItemsInventoryVerify : {
			init : function(cartID,_tag,Q)	{
				var r = 0;
				if(cartID)	{
					this.dispatch(cartID,_tag,Q);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In calls.cartItemsInventoryVerify, no cartID passed.','gMessage':true});
					}
				return r;
				},
			dispatch : function(cartID,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "cartItemsInventoryVerify|"+cartID;
				app.model.addDispatchToQ({"_cmd":"cartItemsInventoryVerify","_cartid":cartID,"_tag": _tag},Q || 'immutable');
				}
			}, //cartItemsInventoryVerify	

// REMOVE from controller when this extension deploys !!!
		cartItemUpdate : {
			init : function(stid,qty,_tag)	{
//				app.u.dump('BEGIN app.calls.cartItemUpdate.');
				var r = 0;
				if(stid && Number(qty) >= 0)	{
					r = 1;
					this.dispatch(stid,qty,_tag);
					}
				else	{
					app.u.throwGMessage("In calls.cartItemUpdate, either stid ["+stid+"] or qty ["+qty+"] not passed.");
					}
				return r;
				},
			dispatch : function(stid,qty,_tag)	{
//				app.u.dump(' -> adding to PDQ. callback = '+callback)
				app.model.addDispatchToQ({"_cmd":"cartItemUpdate","stid":stid,"quantity":qty,"_tag": _tag},'immutable');
				app.ext.cco.u.nukePayPalEC(); //nuke paypal token anytime the cart is updated.
				}
			 }, //cartItemUpdate

//cmdObj - see http://www.zoovy.com/webdoc/?VERB=DOC&DOCID=51609 for details.
//Q not an option. MUST always be immutable.
		cartPaymentQ : 	{
			init : function(cmdObj,_tag)	{
//make sure id is set for inserts.
				if(cmdObj.cmd == 'insert' && !cmdObj.ID)	{cmdObj.ID = app.model.version+app.u.guidGenerator().substring(0,8)}
				cmdObj['_cmd'] = "cartPaymentQ";
				cmdObj['_tag'] = _tag;
				this.dispatch(cmdObj);
				return 1;
				},
			dispatch : function(cmdObj)	{
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			}, //cartPaymentQ
			
// REMOVE from controller when this extension deploys !!!
		cartSet : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj["_cmd"] = "cartSet";
				obj._tag = _tag || {};
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //cartSet


//uses the cart ID, which is passed on the parent/headers.
//always immutable.
		cartOrderCreate : {
			init : function(cartID,_tag)	{
				var r = 0;
				if(cartID)	{
					r = 1;
					this.dispatch(cartID,_tag);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cco.calls.cartOrderCreate, no cart ID passed.","gMessage":true});
					}
				return r;
				},
			dispatch : function(cartID,_tag)	{
				_tag = _tag || {};
				_tag.datapointer = "cartOrderCreate";
				app.model.addDispatchToQ({'_cartid':cartID,'_cmd':'cartOrderCreate','_tag':_tag,'iama':app.vars.passInDispatchV},'immutable');
				}
			},//cartOrderCreate


		cartPaypalSetExpressCheckout : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj = obj || {};
				obj._tag = _tag || {};
				var parentID = obj._tag.parentID || '';
				var extras = "";
				if(window.debug1pc)	{extras = "&sender=jcheckout&fl=checkout-"+app.model.version+debug1pc} //set debug1pc to a,p or r in console to force this versions 1pc layout on return from paypal
				obj._cmd = "cartPaypalSetExpressCheckout";
				obj.cancelURL = (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.model.fetchCartID()+"/cart.cgis?parentID="+parentID+extras : zGlobals.appSettings.https_app_url+"?_session="+app.vars._session+"parentID="+parentID+"&cartID="+app.model.fetchCartID()+"#cart?show=inline";
				obj.returnURL =  (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.model.fetchCartID()+"/checkout.cgis?parentID="+parentID+extras : zGlobals.appSettings.https_app_url+"?_session="+app.vars._session+"parentID="+parentID+"&cartID="+app.model.fetchCartID()+"#checkout?show=checkout";
				
				obj._tag.datapointer = "cartPaypalSetExpressCheckout";
				
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //cartPaypalSetExpressCheckout	

/*

THESE STILL NEED LOVE
left them be to provide guidance later.

		 ||
		_||_
		\  /
		 \/
*/


//each time the cart changes, so does the google checkout url.
		cartGoogleCheckoutURL : {
			init : function()	{
				this.dispatch();
				return 1;
				},
			dispatch : function()	{
				app.model.addDispatchToQ({
					"_cmd":"cartGoogleCheckoutURL",
					"analyticsdata":"", //must be set, even if blank.
					"edit_cart_url" : (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.model.fetchCartID()+"/cart.cgis" : zGlobals.appSettings.https_app_url+"?cartID="+app.model.fetchCartID()+"#cart?show=cart",
					"continue_shopping_url" : (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.model.fetchCartID()+"/" : zGlobals.appSettings.https_app_url+"?cartID="+app.model.fetchCartID(),
					'_tag':{'callback':'proceedToGoogleCheckout','extension':'cco','datapointer':'cartGoogleCheckoutURL'}
					},'immutable');
				}
			}, //cartGoogleCheckoutURL	


		cartAmazonPaymentURL : {
			init : function()	{
				this.dispatch();
				return 1;
				},
			dispatch : function()	{
				var tagObj = {'callback':'',"datapointer":"cartAmazonPaymentURL","extension":"cco"}
				app.model.addDispatchToQ({
"_cmd":"cartAmazonPaymentURL",
"shipping":1,
"CancelUrl":zGlobals.appSettings.https_app_url+"cart.cgis?cartID="+app.model.fetchCartID(),
"ReturnUrl":zGlobals.appSettings.https_app_url,
"YourAccountUrl": zGlobals.appSettings.https_app_url+"customer/orders/",
'_tag':tagObj},'immutable');
				}
			}

		}, //calls





					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\




	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
//no templates or significant checks should occur in this init. templates are app specific (checkout_active has different templates than checkout_passive)
		init : {
			onSuccess : function()	{
				return true; //returns false if checkout can't load due to account config conflict.
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.orderCreate.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				}
			}, //init

//display the '%changes', but make no adjustments to the cart.
//can be used in store, but was built for admin UI where a merchant may want to oversell.
//the checkout extension has a callback for adjusting the inventory based on availability.
		adminInventoryDiscrepencyDisplay : {
			onSuccess : function(_rtag)	{
				_rtag.jqObj = _rtag.jqObj || $('#globalMessaging');
				if(!$.isEmptyObject(app.data[_rtag.datapointer]['%changes']))	{
					var msgObj = {}
					msgObj.message = "Inventory not available (manual corrections may be needed):<ul>";
					for(var key in app.data[_rtag.datapointer]['%changes']) {
						msgObj.message += "<li>sku: "+key+" shows only "+app.data[rd.datapointer]['%changes'][key]+" available<\/li>";
						}
					msgObj.message += "<\/ul>";
					msgObj.persistent = true;
					msgObj.errtype = 'halt';
					_rtag.jqObj.anymessage(msgObj);
					}
				else	{
					//there were no 'changes'.
					}
				}
			},

		proceedToGoogleCheckout : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN cco.callbacks.proceedToGoogleCheckout.onSuccess');
//code for tracking the google wallet payment in GA as a conversion.
				_gaq.push(function() {
					var pageTracker = _gaq._getAsyncTracker();
					setUrchinInputCode(pageTracker);
					});
//getUrchinFieldValue is defined in the ga_post.js file. It's included as part of the google analytics plugin.
				document.location= app.data[tagObj.datapointer].URL +"&analyticsdata="+getUrchinFieldValue();
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on checkout page.
				app.u.throwMessage(responseData,uuid);
				}
			}
		}, //callbacks

		

//Pass in an object (typically based on $form.serializeJSON) and 
//this will make sure that specific fields are populated based on tender type.
//rather than returning specific error messages (which may need to change based on where this is used, an array of which fields are missing is returned
//plus, this allows for the attribute/fields to be modified w/ css, whereas returning messages wouldn't allow for that.
		validate : {
			
			CREDIT : function(vars)	{
				if(vars && typeof vars == 'object')	{
					var errors = new Array(); // what is returned. an array of the payment fields that are not correct.
					if(vars['payment/CC'] && app.u.isValidCC(vars['payment/CC']))	{} else	{errors.push("payment/CC");}
					if(vars['payment/MM'] && app.u.isValidMonth(vars['payment/MM']))	{} else {errors.push("payment/MM");}
					if(vars['payment/YY'] && app.u.isValidCCYear(vars['payment/YY']))	{} else {errors.push("payment/YY");}
					if(vars['payment/CV'] && vars['payment/CV'].length > 2){} else {errors.push("payment/CV")}
					return (errors.length) ? errors : false;
					}
				else	{
					app.u.throwGMessage("in cco.u.validate.CREDIT, vars is empty or not an object.");
					return false;
					}
				
				},
			
			ECHECK : function(vars) {
				var errors = new Array(), // what is returned. an array of the payment fields that are not correct. 
				echeckFields = new Array("EA","ER","EN","EB","ES","EI"),
				L = echeckFields.length;
				for(var i = 0; i < L; i += 1)	{
					if(vars[echeckFields[i]])	{} else {errors.push(echeckFields[i]);}
					}
				return (errors.length) ? errors : false;
				},
			
			PO : function(vars)	{
				var errors = new Array(); // what is returned. an array of the payment fields that are not correct. 
				if(vars.PO){} else	{errors.push("PO")}
				return (errors.length) ? errors : false;
				}
			
			}, //validate


		a : {
			
			
			getCartAsJqObj : function(vars)	{
				vars = vars || {};
				var r; //what is returned.
				if(vars.templateID)	{
					$cart = $(app.renderFunctions.createTemplateInstance(vars.templateID,vars));
					$cart.attr('data-template-role','cart');
//will fetch an entirely new copy of the cart from the server.
//still requires a dispatch be sent OUTSIDE this
					$cart.on('fetch.cart',function(event,P){
						var $c = $(this);
						$c.empty().showLoading({'message':'Updating cart contents'});
						app.calls.refreshCart.init({
							'callback':'anycontent',
							'onComplete' : P.onComplete,
							'templateID' : $c.data('templateid'),
							'jqObj' : $c
							},P.Q);
						});
//will update the cart based on what's in memory.
					$cart.on('refresh.cart',function(event,P){
						var $c = $(this);
						$c.intervaledEmpty();
						if($c.data('anycontent'))	{$c.anycontent('destroy')}
						$c.anycontent({
							'datapointer':'cartDetail|'+app.model.fetchCartID(),
							'templateID' : $c.data('templateid')
							})
						});
					r = $cart;
					}
				else	{
					r = $("<div>").anymessage({'message':'In cco.a.getCartAsJqObj, vars.templateID not specified.','gMessage':true});
					}
				
				return r;
				}
			
			},

////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

//NOTE TO SELF:
//use if/elseif for payments with special handling (cc, po, etc) and then the else should handle all the other payment types.
//that way if a new payment type is added, it's handled (as long as there's no extra inputs).
			buildPaymentQ : function($form)	{
//				app.u.dump("BEGIN cco.u.buildPaymentQ");
				var sfo = $form.serializeJSON() || {},
				payby = sfo["want/payby"];
//				app.u.dump(" -> payby: "+payby);
				if(payby)	{
					if(payby.indexOf('WALLET') == 0)	{
						app.ext.cco.calls.cartPaymentQ.init($.extend({'cmd':'insert'},app.ext.cco.u.getWalletByID(payby)));
						}
					else if(payby == 'CREDIT')	{
						app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","TN":"CREDIT","CC":sfo['payment/CC'],"CV":sfo['payment/CV'],"YY":sfo['payment/YY'],"MM":sfo['payment/MM']});
						}				
					else if(payby == 'PO')	{
						app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","TN":"PO","PO":sfo['payment/PO']});
						}				
					else if(payby == 'ECHECK')	{
						app.ext.cco.calls.cartPaymentQ.init({
							"cmd":"insert",
							"TN":"ECHECK",
							"EA":sfo['payment/EA'],
							"ER":sfo['payment/ER'],
							"EN":sfo['payment/EN'],
							"EB":sfo['payment/EB'],
							"ES":sfo['payment/ES'],
							"EI":sfo['payment/EI']
							});
						}
					else	{
						app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","TN":payby });
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cco.u.buildPaymentQ, unable to determine payby value','gMessage':true});
					}
				},


			paymentMethodsIncludesGiftcard : function(datapointer)	{
				var r = false;
				if(app.data[datapointer] && app.data[datapointer]['@methods'] && app.data[datapointer]['@methods'].length)	{
					var payMethods = app.data[datapointer]['@methods'],
					L = app.data[datapointer]['@methods'].length;

					for(var i = 0; i < L; i += 1)	{
						if(payMethods[i].id.indexOf('GIFTCARD:') === 0)	{
							r = true;
							break;
							}
						}
					}
				else	{
					//app.data.datapointer is empty
					}
				return r;
				},


//A simple check to make sure that all the required inputs are populated for a given address.  
//returns boolean
//this is used in checkout for pre-existing addresses, to make sure they're complete.
			verifyAddressIsComplete : function(addrObj,addressType)	{
				var r = true;
				if(typeof addrObj === 'object')	{
					if(!addrObj[addressType+'/address1'])	{r = false}
					else if(!addrObj[addressType+'/city'])	{r = false}
					else if(!addrObj[addressType+'/countrycode'])	{r = false}
					else	{}
	//we're returning boolean, so if we already a false, no need to verify further. if true, make sure postal and region are set for US
					if(r == true && addrObj[addressType+'/countrycode'] == 'US')	{
						if(!addrObj[addressType+'/postal'])	{r = false}
						else if(!addrObj[addressType+'/region'])	{r = false}
						else	{}
						}
					}
				else	{
					r = false;
					$('#globalMessaging').anymessage({'message':'In cco.u.verifyAddressIsComplete, addrObj is not an object [typeof: '+(typeof addrObj)+']','gMessage':true});
					}
				return r;
				},

//pass in either 'bill' or 'ship' to determine if any predefined addresses for that type exist.
//buyerAddressList data should already have been retrieved by the time this is executed.
			buyerHasPredefinedAddresses : function(TYPE)	{
				var r; //What is returned. TFU.  U = unknown (no TYPE)
				if(TYPE)	{
					if(app.data.buyerAddressList && !$.isEmptyObject(app.data.buyerAddressList['@'+TYPE]))	{r = true}
					else	{r = false}
					}
				return r;
				},

//will get the items from a cart and return them as links. used for social marketing.
			cartContentsAsLinks : function(datapointer)	{
//				app.u.dump('BEGIN cco.u.cartContentsAsLinks.');
//				app.u.dump(' -> datapointer = '+datapointer);
				var r = "";
				var L = app.model.countProperties(app.data[datapointer]['@ITEMS']);
//				app.u.dump(' -> # items in cart: '+L);
				for(var i = 0; i < L; i += 1)	{
//skip coupons.
					if(app.data[datapointer]['@ITEMS'][i].sku[0] != '%')	{
						r += "http://"+app.vars.sdomain+"/product/"+app.data[datapointer]['@ITEMS'][i].sku+"/\n";
						}
					}
//				app.u.dump('links = '+r);
				return r;
				}, //cartContentsAsLinks

//This will tell if there's a paypal tender in the paymentQ. doesn't check validity or anything like that. a quick function to be used when re-rendering panels.
			thisSessionIsPayPal : function()	{
				return (this.modifyPaymentQbyTender('PAYPALEC',null)) ? true : false;
				},

//Will check the payment q for a valid paypal transaction. Used when a buyer leaves checkout and returns during the checkout init process.
//according to B, there will be only 1 paypal tender in the paymentQ.
			aValidPaypalTenderIsPresent : function()	{
//				app.u.dump("BEGIN cco.aValidPaypalTenderIsPresent");
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					return (Math.round(+new Date(PQI.TIMESTAMP)) > +new Date()) ? true : false;
					});
				},
/*
once paypalEC has been approved by paypal, a lot of form fields lock down, but the user may decide to change
payment methods or they may add something new to the cart. If they do, execute this function. It will remove the paypal params from the session/cart and the re-initiate checkout. Be sure to do an immutable dispatch after executing this if value returned is > 0.
note - dispatch isn't IN the function to give more control to developer. (you may want to execute w/ a group of updates)
*/
			nukePayPalEC : function(_tag) {
//				app.u.dump("BEGIN cco.u.nukePayPalEC");
				app.ext.orderCreate.vars['payment-pt'] = null;
				app.ext.orderCreate.vars['payment-pi'] = null;
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					//the delete cmd will reset want/payby to blank.
					app.ext.cco.calls.cartPaymentQ.init({'cmd':'delete','ID':PQI.ID},_tag || {'callback':'suppressErrors'}); //This kill process should be silent.
					});
				},

//pass in a tender/TN [CASH, PAYPALEC, CREDIT] and an array of matching id's is returned.
//used for when a paypal EC payment exists and has to be removed.
//if someFunction is set then that function will get executed over each match.
//the value returned gets added to an array, which is returned by this function.
//the entire lineitem in the paymentQ is passed in to someFunction.
			modifyPaymentQbyTender : function(tender,someFunction){
//				app.u.dump("BEGIN cco.u.modifyPaymentQbyTender");
				var inc = 0, //what is returned if someFunction not present. # of items in paymentQ affected.
				r = new Array(), //what is returned if someFunction returns anything.
				returned; //what is returned by this function.
				var cartID = app.model.fetchCartID(); // ### TODO -> this can't use fetchCartID. MUST use cart in focus.
				if(tender && app.data['cartDetail|'+cartID] && app.data['cartDetail|'+cartID]['@PAYMENTQ'])	{
					if(app.data['cartDetail|'+cartID]['@PAYMENTQ'].length)	{
	//					app.u.dump(" -> all vars present. tender: "+tender+" and typeof someFunction: "+typeof someFunction);
						var L = app.data['cartDetail|'+cartID]['@PAYMENTQ'].length;
	//					app.u.dump(" -> paymentQ.length: "+L);
						for(var i = 0; i < L; i += 1)	{
	//						app.u.dump(" -> "+i+" TN: "+app.data.cartDetail['@PAYMENTQ'][i].TN);
							if(app.data['cartDetail|'+cartID]['@PAYMENTQ'][i].TN == tender)	{
								inc += 1;
								if(typeof someFunction == 'function')	{
									r.push(someFunction(app.data['cartDetail|'+cartID]['@PAYMENTQ'][i]))
									}
								}
							}
						returned = (typeof someFunction == 'function') ? r : inc;
						}
					else	{
						returned = inc;
						} //paymentQ is empty. no error or warning.
					}
				else	{
					app.u.dump("WARNING! getPaymentQidByTender failed because tender ["+tender+"] not set or @PAYMENTQ does not exist.");
					}
//				app.u.dump(" -> num tender matches: "+r);
				return returned;
				},
			
//used in admin. adminBuyerGet formats address w/ ship_ or bill_ instead of ship/ or bill/
// addrArr is is the customerGet (for either @ship or @bill). ID is the ID/Shortcut of the method selected/desired.
			getAndRegularizeAddrObjByID : function(addrArr,ID,type,regularize)	{
				var r = false; //what is returned.
				if(typeof addrArr == 'object' && ID && type)	{
					var address = addrArr[app.ext.admin.u.getIndexInArrayByObjValue(addrArr,'_id',ID)];
					if(regularize)	{
						for(var index in address)	{
							if(index.indexOf(type+'_') >= 0)	{
								address[index.replace(type+'_',type+'/')] = address[index];
								delete address[index];
								}
							}
						}
					r = address;
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In cco.u.getAndRegularizeAddrObjByID, id ["+ID+"] and/or type ["+type+"] not passed or addrArr not an object ["+(typeof addrArr)+"].",'gMessage':true});
					}
				return r;
				
				},
			
			getAddrObjByID : function(type,id)	{
				var r = false; //what is returned.
				if(type && id)	{
					if(app.data.buyerAddressList && app.data.buyerAddressList['@'+type] && app.data.buyerAddressList['@'+type].length)	{
						var L = app.data.buyerAddressList['@'+type].length;
						for(var i = 0; i < L; i += 1)	{
							if(app.data.buyerAddressList['@'+type][i]._id == id)	{
								r = app.data.buyerAddressList['@'+type][i];
								break;
								}
							else	{}//not a match. continue loop.
							}
						}
					else	{
						//addresses not available or do not exist.
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In cco.u.getAddrObjByID, type or id not passed.",'gMessage':true});
					}
				return r;
				},
			
			getWalletByID : function(ID)	{
				var r = false;
				if(app.data.buyerWalletList && app.data.buyerWalletList['@wallets'].length)	{
					var L = app.data.buyerWalletList['@wallets'].length;
					for(var i = 0; i < L; i += 1)	{
						if(ID == app.data.buyerWalletList['@wallets'][i].ID)	{
							r = app.data.buyerWalletList['@wallets'][i];
							break;
							}
						}
					}
				return r;
				},

//paymentID is the payment that is selected.
//data is a data object, such as cartDetail or an invoice.
//isAdmin is used to determine if additional output is included (flag as paid checkbox and some other inputs)
// SANITY -> checkout uses the required attribute for validation. do not remove!
// when switching between payment types and supplemental inputs, always REMOVE the old supplemental inputs. keeps it clean & checkout doesn't like extra vars.
			getSupplementalPaymentInputs : function(paymentID,data,isAdmin)	{
//				app.u.dump("BEGIN control.u.getSupplementalPaymentInputs ["+paymentID+"]");
//				app.u.dump(" -> data:"); app.u.dump(data);
				data = data || {}
				if(paymentID)	{
					var $o = $("<div />").addClass("paybySupplemental").attr('data-app-role','supplementalPaymentInputsContainer'), //what is returned. a jquery object (ul) w/ list item for each input of any supplemental data.
					tmp = '', //tmp var used to put together string of html to append to $o
					payStatusCB = "<div><label><input type='checkbox' name='flagAsPaid' \/>Flag as paid<\/label><\/div>"
					
					if(paymentID.substr(0,7) == 'WALLET:')	{
						paymentID = 'WALLET';
						}	
					
					switch(paymentID)	{
		//for credit cards, we can't store the # or cid in local storage. Save it in memory so it is discarded on close, reload, etc
		//expiration is less of a concern
						case 'CREDIT':
	
							tmp += "<div><label>Credit Card # <input type='text' size='30' name='payment/CC' onKeyPress='return app.u.numbersOnly(event);' class='creditCard' value='";
							if(data['payment/CC']){tmp += data['payment/CC']}
							tmp += "' required='required' /><\/label><\/div>";
							
							tmp += "<div><label>Expiration<\/label><select name='payment/MM' class='creditCardMonthExp' required='required'><option><\/option>";
							tmp += app.u.getCCExpMonths(data['payment/MM']);
							tmp += "<\/select>";
							tmp += "<select name='payment/YY' class='creditCardYearExp'  required='required'><option value=''><\/option>"+app.u.getCCExpYears(data['payment/YY'])+"<\/select><\/div>";
							
							tmp += "<div><label for='payment/CV'>CVV/CID<input type='text' size='4' name='payment/CV' class=' creditCardCVV' onKeyPress='return app.u.numbersOnly(event);' value='";
							if(data['payment/CV']){tmp += data['payment/CV']}
							tmp += "'  required='required' /><\/label> <span class='ui-icon ui-icon-help creditCardCVVIcon' onClick=\"$('#cvvcidHelp').dialog({'modal':true,height:400,width:550});\"></span><\/div>";
							
							if(isAdmin === true)	{
								tmp += "<div><label><input type='radio' name='VERB' value='AUTHORIZE'>Authorize<\/label><\/div>"
								tmp += "<div><label><input type='radio' name='VERB' value='CHARGE'>Charge<\/label><\/div>"
								tmp += "<div><label><input type='radio' name='VERB' value='REFUND'>Refund<\/label><\/div>"
								}
							break;
	
							case 'WALLET':
								if(isAdmin === true)	{
									tmp += "<div><label><input type='radio' name='VERB' value='AUTHORIZE'>Authorize<\/label><\/div>"
									tmp += "<div><label><input type='radio' name='VERB' value='CHARGE' checked='checked'>Charge<\/label><\/div>"
									}
								else	{$o = false;} //inputs are only present in admin interface.
							break;
		
							case 'CASH':
							case 'MO':
							case 'CHECK':
							case 'PICKUP':
	//will output a flag as paid checkbox ONLY in the admin interface.
	//if this param is passed in a store, it will do nothing.
							if(isAdmin === true)	{
								tmp += payStatusCB;
								}
							else	{$o = false;} //inputs are only present in admin interface.
							break;
		
						case 'PO':
							tmp = $("<div \/>",{'title':'PO Number'});
	
							var $input = $("<input \/>",{'type':'text','required':'required','size':30,'name':'payment/PO','placeholder':'PO Number'}).addClass('purchaseOrder');
							if(data['payment/PO'])	{$input.val(data['payment/PO'])}
							$input.appendTo(tmp);
							if(isAdmin === true)	{
								tmp.append(payStatusCB);
								}
							break;
		
						case 'ECHECK':
							var echeckFields = {
								"payment/EA" : "Account #",
								"payment/ER" : "Routing #",
								"payment/EN" : "Account Name",
								"payment/EB" : "Bank Name",
								"payment/ES" : "Bank State",
								"payment/EI" : "Check #"
								}
							tmp = $("<div \/>");
							for(var key in echeckFields) {
	//the info below is added to the pdq but not immediately dispatched because it is low priority. this could be changed if needed.
	//The field is required in checkout. if it needs to be optional elsewhere, remove the required attribute in that code base after this has rendered.
								var $input = $("<input \/>",{'type':'text','required':'required','size':30,'name':key,'placeholder':echeckFields[key].toLowerCase()}).addClass('echeck');
								if(data[key])	{$input.val(data[key])}
								$("<div \/>",{'title':echeckFields[key]}).append($input).appendTo(tmp);
								}
							break;
						default:
	//if no supplemental material is present, return false. That'll make it easy for any code executing this to know if there is additional inputs or not.
							$o = false; //return false if there is no supplemental fields
						}
					if($o)	{
						$o.append(tmp);
	//set events to save values to memory. this will ensure data repopulates as panels get reloaded in 1PC.
						$(':input',$o).each(function(){
							$(this).off('change.save').on('change.save',function(){
								data[$(this).attr('name')] = $(this).val();
								});
							});
						} //put the li contents into the ul for return.
					}
				else	{
					$o = false; //no paymentID specified. intentionally doens't display an error.
					}
				return $o;
//				app.u.dump(" -> $o:");
//				app.u.dump($o);
			},

//run this just prior to creating an order.
//will clean up cart object.
			sanitizeAndUpdateCart : function($form,_tag)	{
				if($form)	{
					_tag = _tag || {};
					var formObj = $form.serializeJSON();
//po number is used for purchase order payment method, but also allowed for a reference number (if company set and po not payment method).
					if(app.ext.orderCreate.vars['want/payby'] != "PO" && formObj['want/reference_number'])	{
						formObj['want/po_number'] = formObj['want/reference_number'];
						}
// to save from bill to bill, pass bill,bill. to save from bill to ship, pass bill,ship
					var populateAddressFromShortcut = function(fromAddr,toAddr)	{
						var addr = app.ext.cco.u.getAddrObjByID(fromAddr,formObj[fromAddr+'/shortcut']);
						for(var index in addr)	{
							if(index.indexOf(fromAddr+'/') == 0)	{ //looking for bill/ means fields like id and shortcut won't come over, which is desired behavior.
								if(fromAddr == toAddr)	{
									formObj[index] = addr[index];
									}
								else	{
									formObj[index.replace(fromAddr+'/',toAddr+'/')] = addr[index]; //when copying bill to ship, change index accordingly.
									}
								}
							}
						}

//if a shortcut is selected, save the address info into the cart.
					if(formObj['bill/shortcut'])	{
						populateAddressFromShortcut('bill','bill');
						}

//if a shortcut is selected, save the address info into the cart.
					if(formObj['ship/shortcut'])	{
						populateAddressFromShortcut('ship','ship');
						}
//if ship to billing address is enabled, copy the billing address into the shipping fields.
					else if(formObj['want/bill_to_ship'] && formObj['bill/shortcut'])	{
						populateAddressFromShortcut('bill','ship');	
						}
//bill to ship, but no short cut (not logged in)
					else if(formObj['want/bill_to_ship'])	{
						for(var index in formObj)	{
//copy billing fields into shipping. not email tho.
							if(index.indexOf('bill/') == 0 && index != 'bill/email')	{ 
								formObj[index.replace('bill/','ship/')] = formObj[index]
								}
							}
						}
//regularize checkbox data.
					if(formObj['want/bill_to_ship'] == 'ON')	{formObj['want/bill_to_ship'] = 1} 
					if(formObj['want/create_customer'] == 'ON')	{formObj['want/create_customer'] = 1}

//these aren't valid checkout field. used only for some logic processing.
					delete formObj['want/reference_number'];
					delete formObj['want/bill_to_ship_cb'];
//cc and cv should never go. They're added as part of cartPaymentQ
					delete formObj['payment/cc'];
					delete formObj['payment/cv'];
/* these fields are in checkout/order create but not 'supported' fields. don't send them */				
					delete formObj['giftcard'];
					delete formObj['want/bill_to_ship_cb'];
					delete formObj['coupon'];	

					app.calls.cartSet.init(formObj,_tag); //adds dispatches.
					}
				}, //sanitizeAndUpdateCart


//run when a payment method is selected. updates memory and adds a class to the radio/label.
//will also display additional information based on the payment type (ex: purchase order will display PO# prompt and input)
// ### TODO -> updatePayDetails is used in orders.js.  See if it can be replaced w/ cco.showSupplementalInputs
			updatePayDetails : function($container)	{
//				app.u.dump("BEGIN order_create.u.updatePayDetails.");
				var paymentID = $("[name='want/payby']:checked",$container).val();

				var o = '';
				$('.ui-state-active',$container).removeClass('ui-state-active ui-corner-top ui-corner-all ui-corner-bottom');
 //in Admin, some of the supplemental inputs are shared between payment types (flag as paid)
//so to ensure the checkbox isn't on by accident, remove all supplemental material when switching between.
				$('.paybySupplemental', $container).empty().remove();
				var $radio = $("[name='want/payby']:checked",$container);
				
				
//				app.u.dump(" -> $radio.length: "+$radio.length);
				var $supplementalContainer = $("[data-ui-supplemental='"+paymentID+"']",$container);
//only add the 'subcontents' once. if it has already been added, just display it (otherwise, toggling between payments will duplicate all the contents)
				if($supplementalContainer.length == 0)	{
					app.u.dump(" -> supplemental is empty. add if needed.");
					var supplementalOutput = app.ext.cco.u.getSupplementalPaymentInputs(paymentID,{},true); //this will either return false if no supplemental fields are required, or a jquery UL of the fields.
//					app.u.dump("typeof supplementalOutput: "+typeof supplementalOutput);
					if(typeof supplementalOutput == 'object')	{
						$radio.parent().addClass('ui-state-active ui-corner-top'); //supplemental content will have bottom corners
//						app.u.dump(" -> getSupplementalPaymentInputs returned an object");
						supplementalOutput.addClass('ui-widget-content ui-corner-bottom');
//save values of inputs into memory so that when panel is reloaded, values can be populated.
						$('input[type=text], select',supplementalOutput).change(function(){
							app.ext.cco.vars[$(this).attr('name')] = $(this).val(); //use name (which coforms to cart var, not id, which is websafe and slightly different 
							})

						$radio.parent().after(supplementalOutput);
						}
					else	{
						//no supplemental material.
						$radio.parent().addClass('ui-state-active ui-corner-all');
						}
					}
				else	{
//supplemental material present and already generated once (switched back to it from another method)
					$radio.parent().addClass('ui-state-active ui-corner-top'); //supplemental content will have bottom corners
					$supplementalContainer.show();
					} //supllemental content has already been added.

				}, //updatePayDetails


//accepts an object (probable a serialized form object) which needs sku and qty.  In an admin session, also accepts price.
//Will validate required fields and provide any necessary formatting.
//used in orderCreate in the admin UI for adding a line item and a re-order for previous orders.
// ### TODO -> store_product has a duplicate of this. compare and eliminate one if possible
			buildCartItemAppendObj : function(sfo,_cartid)	{
				var r = false; //what is returned. either an object or false
				if(sfo.sku && sfo.qty)	{
					if(sfo.price)	{}
					else	{delete sfo.price} //don't pass an empty price, will set price to zero. if a price is passed when not in an admin session, it'll be ignored.
					sfo.uuid = app.u.guidGenerator();
					if(_cartid)	{sfo._cartid = _cartid;}
					else	{sfo._cartid = app.model.fetchCartID();}
					r = sfo;
					}
				else	{
					app.u.dump("In cco.u.buildCartItemAppendObj, both a sku ["+sfo.sku+"] and a qty ["+sfo.qty+"] are required and one was not set.",'warn')
					r = false; //sku and qty are required.
					}
				return r;
				},
//used in order create for adding a lineitem from a previous order, so test any changes there (admin UI) after making changes.
// ### TODO -> check out the execOrder2Cart in myRIA. may be better than this one. merge the two.
			buildCartItemAppendSKU : function($container)	{
				app.u.dump("BEGIN cco.u.buildCartItemAppendSKU");
				var r = false; //what is returned. will be true if dispatch is created.
				
				if($container instanceof jQuery)	{
					var sfo = this.buildCartItemAppendObj($container.serializeJSON(),$container.closest("[data-app-role='checkout']").data('cartid'));
					if(sfo)	{
						app.calls.cartItemAppend.init(sfo,{'callback':'showMessaging','jqObj':$container,'message':'Item added to cart.'},'immutable');
						r = sfo;
						}
					else	{
						$container.anymessage({"message":"In orderCreate.e.cartItemAddStid, buildCartItemAppendObj was unsuccessful. see console for details.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In orderCreate.e.cartItemAddStid, no data-app-role='cartItemContainer' specified around trigger element.","gMessage":true});
					}
				return r;
				}

			}, //util






////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		renderFormats : {
//value is set to ISO and sent to API that way. however, cart object returned is in 'pretty'.
//so a check occurs to set selectedCountry to the selected ISO value so it can be 'selected'
// ### TODO -> this will need fixing.
			countriesAsOptions : function($tag,data)	{
				var r = '';
				if(app.data['appCheckoutDestinations|'+data.value] && app.data['cartDetail|'+data.value] && data.bindData.shiptype)	{
					var destinations = app.data.appCheckoutDestinations['@destinations'], L = destinations.length, cartData = app.data['cartDetail|'+data.value];
					for(var i = 0; i < L; i += 1)	{
						r += "<option value='"+destinations[i].ISO+"'>"+destinations[i].Z+"</option>";
						}
					var selected = 'US'; //default
					if(data.bindData.shiptype && cartData[data.bindData.shiptype] && cartData[data.bindData.shiptype][data.bindData.shiptype+'/countrycode'])	{
						selected = cartData[data.bindData.shiptype][data.bindData.shiptype+'/countrycode']
						}
					$("select[name='"+data.bindData.shiptype+"/countrycode']").val(selected);
					}
				else	{
					r = $("<div \/>").anymessage({'persistent':true,'message':'in cco.renderFormats.countriesAsOptions, app.data[appCheckoutDestinations|'+data.value+'] is not available in memory.','gMessage':true});
					}
				$tag.html(r);
				},

//data.value should be the item object from the cart.
			cartItemRemoveButton : function($tag,data)	{

				if(data.value.stid[0] == '%')	{$tag.remove()} //no remove button for coupons.
				else if(data.value.asm_master)	{$tag.remove()} //no remove button for assembly 'children'
				else	{
					if($tag.is('button')){$tag.button({icons: {primary: "ui-icon-closethick"},text: false})}
//					$tag.attr({'data-stid':data.value.stid}).val(0); //val is used for the updateCartQty
					}
				},

			cartItemQty : function($tag,data)	{
				$tag.val(data.value.qty);
//for coupons and assemblies, no input desired, but qty display is needed. so the qty is inserted where the input was.
				if((data.value.stid && data.value.stid[0] == '%') || data.value.asm_master)	{
					$tag.prop('disabled',true).css('border-width','0')
					} 
				else	{
					$tag.attr('data-stid',data.value.stid);
					}
				},

//for displaying order balance in checkout order totals.
//changes value to 0 for negative amounts. Yes, this can happen.			
			orderBalance : function($tag,data)	{
				var o = '';
				var amount = data.value;
//				app.u.dump('BEGIN app.renderFunctions.format.orderBalance()');
//				app.u.dump('amount * 1 ='+amount * 1 );
//if the total is less than 0, just show 0 instead of a negative amount. zero is handled here too, just to avoid a formatMoney call.
//if the first character is a dash, it's a negative amount.  JS didn't like amount *1 (returned NAN)
				
				if(amount * 1 <= 0){
//					app.u.dump(' -> '+amount+' <= zero ');
					o += data.bindData.currencySign ? data.bindData.currencySign : '$';
					o += '0.00';
					}
				else	{
//					app.u.dump(' -> '+amount+' > zero ');
					o += app.u.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
					}
				
				$tag.text(o);  //update DOM.
//				app.u.dump('END app.renderFunctions.format.orderBalance()');
				}, //orderBalance

			secureLink : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.cco.renderFormats.secureLink');
//				app.u.dump(" -> data.windowName = '"+data.windowName+"'");
//if data.windowName is set, the link will open a new tab/window. otherwise, it just changes the page/tab in focus.
				if(app.u.isSet(data.windowName))
					$tag.click(function(){window.open(zGlobals.appSettings.https_app_url+$.trim(data.value)),data.windowName});
				else
					$tag.click(function(){window.location = zGlobals.appSettings.https_app_url+$.trim(data.value)});
				}, //secureLink

//displays the shipping method followed by the cost.
//is used in cart summary total during checkout.
			shipInfoById : function($tag,data)	{
				var o = '';
				var shipMethods = data.value['@SHIPMETHODS'], L = shipMethods.length;
				for(var i = 0; i < L; i += 1)	{
//					app.u.dump(' -> method '+i+' = '+app.data.cartShippingMethods['@methods'][i].id);
					if(shipMethods[i].id == data.value.want.shipping_id)	{
						//sometimes pretty isn't set. also, ie didn't like .pretty, but worked fine once ['pretty'] was used.
						o = "<span class='orderShipMethod'>"+(shipMethods[i]['pretty'] ? shipMethods[i]['pretty'] : shipMethods[i]['name'])+": <\/span>";
//only show amount if not blank.
						if(shipMethods[i].amount)	{
							o += "<span class='orderShipAmount'>"+app.u.formatMoney(shipMethods[i].amount,' $',2,false)+"<\/span>";
							}
						break; //once we hit a match, no need to continue. at this time, only one ship method/price is available.
						}
					}
				$tag.html(o);
				}, //shipInfoById

			walletName2Icon : function($tag,data)	{
				$tag.addClass('paycon_'+data.value.substring(0,4).toLowerCase());
				},
			paymentStatus : function($tag,data)        {
				if(Number(data.value[0]) === 0)        {$tag.append("Paid");}
				else{$tag.append("Unpaid")}
				},
			marketPlaceOrderID : function($tag,data)        {
				var order = app.data['adminOrderDetail|'+data.value];
				var output = "";
				if(order.flow.payment_method == 'AMAZON')        {output = order.mkt.amazon_orderid}
				else if(order.flow.payment_method == 'EBAY')        {output = order.mkt.erefid.split('-')[0]}//splitting at dash shows just the ebay item #
				else if(order.flow.payment_method == 'NEWEGG')        {output = order.mkt.erefid}
				else if(order.flow.payment_method == 'BUY')        {output = order.mkt.erefid}
				else if(order.flow.payment_method == 'SEARS')        {output = order.mkt.sears_orderid}
				else{}
				$tag.append(output);
				}
			}, //renderFormats
		
		e : {
			
			cartItemRemove	: function($ele,p)	{
				var stid = $ele.closest('[data-stid]').data('stid');
				if(stid)	{
					app.ext.cco.calls.cartItemUpdate.init(stid,$ele.val(),{
						'callback' : 'showMessaging',
						'message' : 'Item '+stid+' removed from your cart',
						'jqObj' : $ele.closest('form')
						},'immutable');
					$ele.closest("[data-template-role='cart']").trigger('fetch',{'Q':'immutable'}); //will work if getCartAsJqObj was used to create the cart.
					app.model.dispatchThis('immutable');
					}
				else	{
					$ele.closest('form').anymessage({'message':'In cco.e.cartItemQuantityUpdate, unable to ascertain item STID.','gMessage':true})
					}
				}, //cartItemRemove
			
			cartItemQuantityUpdate : function($ele,p){
				var stid = $ele.closest('[data-stid]').data('stid');
				if(stid)	{
					app.ext.cco.calls.cartItemUpdate.init(stid,$ele.val(),{
						'callback' : 'showMessaging',
						'message' : 'Quantities updated for item '+stid,
						'jqObj' : $ele.closest('form')
						},'immutable');
					$ele.closest("[data-template-role='cart']").trigger('fetch',{'Q':'immutable'}); //will work if getCartAsJqObj was used to create the cart.
					app.model.dispatchThis('immutable');
					}
				else	{
					$ele.closest('form').anymessage({'message':'In cco.e.cartItemQuantityUpdate, unable to ascertain item STID.','gMessage':true})
					}
				}, //cartItemQuantityUpdate

			cartZipUpdateExec : function($ele,p)	{
				
				app.calls.cartSet.init({'ship/postal':$ele.val(), 'ship/region':'','_cartid': $ele.closest("form").find("input[name='_cartid']").val()},{},'immutable');
				$ele.closest("[data-template-role='cart']").trigger('fetch',{'Q':'immutable'});
				app.model.dispatchThis('immutable');
				}, //cartZipUpdateExec

			}
		
		} // r
	return r;
	}