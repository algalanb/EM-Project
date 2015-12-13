#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>


// include the SD library:
#include <SPI.h>
#include <SD.h>

#include "DHT.h" //cargamos la librería DHT
#define DHTPIN 5 //Seleccionamos el pin en el que se //conectará el sensor
#define DHTTYPE DHT11 //Se selecciona el DHT11 (hay //otros DHT)
DHT dht(DHTPIN, DHTTYPE, 20); //Se inicia una variable que será usada por Arduino para comunicarse con el sensor
char *status_sensors;

// set up variables using the SD utility library functions:
Sd2Card card;
SdVolume volume;
SdFile root;

// Update these with values suitable for your network.

const char* ssid = "My_AP";
const char* password = "raspberry";
const char* mqtt_server = "192.168.42.1";
File myFile;
WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char status_aux[50];
int value = 0;
float h;
float t;
String prefix = "Home";
String nodeID = "nodo_mcu_1";

void setup() {
  pinMode(BUILTIN_LED, OUTPUT);     // Initialize the BUILTIN_LED pin as an output
  Serial.begin(115200);
  dht.begin(); //Se inicia el sensor
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  if (!SD.begin(4)) {
    return;
  }
}

void setup_wifi() {

  delay(10);
  // We start by connecting to a WiFi network

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}
void writeSD (char* topic, String msg){
  myFile = SD.open("test.txt", FILE_WRITE);
   
// if the file opened okay, write to it:
  if (myFile) {
  // make a string for assembling the data to log:
  String dataString = "";
  Serial.println(F("Writting in SD..."));
  dataString += "Message arrived [";
  dataString += topic;
  dataString += "] ";
  dataString += msg;
  myFile.println(dataString);
  myFile.close();
  } else {
    Serial.println(F("error opening the file"));
  }
  
  }
void callback(char* topic_in, byte* payload, unsigned int length) {
  
  payload[length] = '\0';
  String payload_str = String((char*)payload);
  char payload_char[payload_str.length()+1];
  payload_str.toCharArray (payload_char, payload_str.length()+1);
  String topic_str(topic_in);
  
  if (topic_str == "/Home/nodo_central/ctrl"){
    
      StaticJsonBuffer<200> jsonBuffer;
      JsonObject& root = jsonBuffer.parseObject(payload_char);
      
      if (!root.success()) {;
        return;
      }
    
      const char* nodo = root["nodo"];
      String nodo_str(nodo);
      const char* op = root["op"];
      String op_str(op);
          if (nodo_str == "nodo_mcu_1"){
              if (op_str == "sub"){
                  client.subscribe("Home/storage");
              }
              else {
                if (op_str == "unsub"){
                  client.unsubscribe("Home/storage");
                }                 
              }
          }
    }
  else {  
  //writeSD (topic_in, payload_str);
    }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      // ... and resubscribe
      client.subscribe("Home/nodo_central/ctrl");
      client.publish("Home/nodo_mcu_1/model","{\"mem\":\"Gb\",\"proc\":\"noUnit\",\"batt\":\"%\",\"lat\":\"seg\"}");
    } else {
      delay(5000);
    }
  }
}

void updateStatus (String channel, String nodeID, char *message){
 String topicbuff = prefix +"/"+ nodeID +"/"+ channel;
 char topic[topicbuff.length()+1];
 topicbuff.toCharArray (topic,topicbuff.length()+1);
  client.publish(topic, message);
  }

void checkTempAndHum (){
  h = dht.readHumidity(); //Se lee la humedad
  t = dht.readTemperature(); //Se lee la temperatura
  long now = millis();
  now = now/1000;
  snprintf (status_aux, 60, "{\"Temp\":\"%1d\", \"Hum\":\"%2d\", \"Time\":\"%3d\"}", int (t), int (h), now);
  status_sensors = status_aux;
  
  }

void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

   checkTempAndHum();
   updateStatus ("istate",nodeID,status_sensors);
   updateStatus ("meta",nodeID,"{\"mem\":\"3\",\"proc\":\"1500\",\"batt\":\"80\",\"lat\":\"0.5\"}");
   delay (5000);
 
}
