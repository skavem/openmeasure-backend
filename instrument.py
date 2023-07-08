from machine import Pin
import time

# def http_post(url, data):
#     import socket
#     import json
#     _, _, host_port, path = url.split('/', 3)
#     host, port = host_port.split(':')
#     addr = socket.getaddrinfo(host, int(port))[0][-1]
#     s = socket.socket()
#     s.connect(addr)
#     json_data = json.dumps(data, separators=(',', ':'))
#     request = 'POST /%s HTTP/1.1\r\nHost: %s\r\nContent-Type: application/json\r\nContent-Length: %d\r\n\r\n%s' % (path, host, len(json_data), json_data
#                                                                                                                    )
#     s.send(bytes(request, 'utf8'))
#     while True:
#         data = s.recv(100)
#         if data:
#             print(str(data, 'utf8'), end='')
#         else:
#             break
#     s.close()


# http_post('http://192.168.1.100:2000/', {'hi': 'hi'})

data_pin = Pin(4, Pin.IN)
clock_pin = Pin(5, Pin.IN)

data = [False] * 24
mm_in = False
recieved_bit_location = 0
measured_value = .0
last_recieved = .0
last_send = .0


def process_data():
    global mm_in
    global measured_value

    measured_value = 0.0
    if (data[23] == False):
        mm_in = False
        for i in range(16):
            if (data[i] == True):
                measured_value += data[i] * pow(2, i) / 100
            if (data[20] == True):
                measured_value = measured_value * -1

    if (data[23] == True):
        mm_in = True
        for i in range(16):
            for i in range(16):
                measured_value += data[i] * pow(2, i - 1) / 1000
            if (data[0]):
                measured_value += 0.0005
            if (data[20]):
                measured_value = measured_value * -1

    print(data)


def clk_IRQ(pin):
    global recieved_bit_location
    global data
    global last_recieved

    if (time.ticks_ms() - last_recieved > 2):
        recieved_bit_location = 0

    if (recieved_bit_location <= 23):
        data[recieved_bit_location] = data_pin.value()
        recieved_bit_location += 1

    if (recieved_bit_location == 24):
        recieved_bit_location = 0
        process_data()

    last_recieved = time.ticks_ms()


clock_pin.irq(trigger=Pin.IRQ_RISING, handler=clk_IRQ)
