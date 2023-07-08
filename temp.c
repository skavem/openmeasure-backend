#include <Keyboard.h>

#define clk 2
#define btn 3
#define dat 4

boolean data[24] = {
    0, 0, 0, 0, 0, 
    0, 0, 0, 0, 0, 
    0, 0, 0, 0, 0, 
    0, 0, 0, 0, 0,
    0, 0, 0, 0}; 
    
boolean mm_in = 0; 
int received_bit_location = 0;
float measured_value = 0.0;
long last_received = 0;
long last_send = 0;

void process_data();

void setup() {
    pinMode(clk, INPUT);
    pinMode(btn, INPUT_PULLUP);
    pinMode(dat, INPUT);
    Serial.begin(9600);
    Keyboard.begin();
    attachInterrupt(digitalPinToInterrupt(clk), clk_ISR, FALLING);
    attachInterrupt(digitalPinToInterrupt(btn), buttonClickEvent, FALLING);
}

void loop() {
    delay(1000);
}

void process_data() {

    measured_value = 0.0;

    if (data[23] == 0) { /
        mm_in = 0;
        for (int i = 0; i <= 15; i++) {
            measured_value += data[i] * pow(2, i) / 100.0;
        }
        if (data[20] == 1) {
            measured_value = measured_value * -1; 
        }
    }

    if (data[23] == 1) { 
        mm_in = 1;
        for (int i = 1; i <= 16; i++) {
            measured_value += data[i] * pow(2, (i - 1)) / 1000.0;
        }
        if (data[0] == 1) {
            measured_value += 0.0005;
        }
        if (data[20] == 1) {
            measured_value = measured_value * -1;
        }
    }
}

void clk_ISR() {
    if (millis() - last_received > 2) {
        received_bit_location = 0;
    }

    if (received_bit_location <= 23) {
        data[received_bit_location] = !digitalRead(dat);
        received_bit_location++;
    }

    if (received_bit_location == 24) {
        received_bit_location = 0;
        process_data();
    }

    last_received = millis();
}

void buttonClickEvent() {
    if (millis() - last_send > 500) {
        if (mm_in == 1) { // if it's in the inch mode
            Serial.print(measured_value, 4);
            Serial.println(" in");
            Keyboard.print(measured_value, 4);
            Keyboard.println(" in");
        } else {
            Serial.print(measured_value, 2);
            Serial.println(" mm");
            Keyboard.print(measured_value, 2);
            Keyboard.println(" mm");
        }
        last_send = millis();
    }
}