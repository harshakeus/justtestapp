const express = require('express');
var bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');
var cookieParser = require('cookie-parser');
var weather = require('openweather-apis');
 
weather.setLang('it');
weather.setUnits('metric');
weather.setAPPID('79176779e66a794eb53ea0316714f7c9');

const mongo = require('mongodb').MongoClient;
const url = 'mongodb://mongo:27017';

const app = express();
const port = 3002;
var count = 0;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

mongo.connect(url,{ useNewUrlParser: true }, (err, client) => {
    const db = client.db('APISERVICE');
    const collection = db.collection('users');
        app.get('/', function(req, res){

                 //   console.log(req.query.lat,req.query.lon);  
                    var userDetail = req.cookies.apiData;             
                if(userDetail){
                    
                
                            if (err) {
                            console.error(err)
                            return
                            }
                        

                            async function check(){

                                try{
                                    weather.setCoordinate(req.query.lat, req.query.lon);
                                    var userd = await collection.findOne({email:userDetail.email});

                                    if(userd.token === userDetail.token){

                                        if(Math.floor(new Date() / 1000)<userd.validity){
                                            weather.getAllWeather(function(err, JSONObj){
                                                if(err){
                                                    return res.send(err);
                                                }
                                                return res.json(JSONObj);
                                              });
                                            
                                             
                                           
                                        }
                                        else if(userd.refresh_token == userDetail.refresh_token){

                                            res.cookie('apiData',"");
                                            res.clearCookie('apiData');
                                            var newtoken = uuidv1();
                                            var new_refreshtoken = uuidv1();

                                            await collection.update({email:userDetail.email},{$set:{token:newtoken,refresh_token:new_refreshtoken,validity:Math.floor(new Date() / 1000)+259200}});

                                            res.cookie('apiData',{"email":userDetail.email,
                                                        "token":newtoken,
                                                        "refresh_token":new_refreshtoken});
                                            weather.getAllWeather(function(err, JSONObj){
                                                        if(err){
                                                            return res.send(err);
                                                        }
                                                        return res.json(JSONObj);
                                                      });

                                        }
                                        else{
                                            res.cookie('apiData',"");
                                            res.clearCookie('apiData');
                                        return   res.send('invalid refresh token send email password in headers');
                                        }


                                    }
                                    else{
                                        res.cookie('apiData',"");
                                            res.clearCookie('apiData');
                                    return  res.send('in valid token ,please send email and password in headers');
                                    }
                                    

                                }
                                catch(e){
                                    console.log(e);
                                    res.cookie('apiData',"");
                                    res.clearCookie('apiData');
                                    return res.send('error encountered try again');
                                }

                            }

                            check();

                    
                    
            
                    

                }
                else if(req.headers.email&&req.headers.pwd)
                {

                    async function ff(){
                        try{
                    var token1 = uuidv1();
                    var refreshtoken1 = uuidv1();
                    var k = await  collection.findOne({email:req.headers.email});
                // await db.collection.findOneAndUpdate({email:req.headers.email},{$set:{token:token1,refresh_token:refreshtoken1,validity:Math.floor(new Date() / 1000)+259200}},{upsert:true});

                        if(k){
                           
                            if(req.headers.pwd == k.pwd){
                                await collection.update({email:req.headers.email},{$set:{token:token1,refresh_token:refreshtoken1,validity:Math.floor(new Date() / 1000)+259200}})
                                res.cookie('apiData',{"email":req.headers.email,
                                "token":token1,
                                "refresh_token":refreshtoken1});
                                return res.send('new cookies set ready to use api service');

                            }
                            else{
                            return res.send('unauthorized user');
                            }
                        }
                        else{

                        await collection.insertOne({email:req.headers.email,pwd:req.headers.pwd,token:token1,refresh_token:refreshtoken1,validity:Math.floor(new Date() / 1000)+259200});
                        res.cookie('apiData',{"email":req.headers.email,
                        "token":token1,
                            "refresh_token":refreshtoken1});
                            return res.send('Registration successful ready to use api service');
                        }


                    }
                    catch(e){
                        console.log(e);
                    }

                }
                ff();
            }
                
                
                else{
                    res.send('please provide email and password in headers');
                }


        
            
            
        });


app.listen(port, () => console.log(`Example app listening on port ${port}!`));


});