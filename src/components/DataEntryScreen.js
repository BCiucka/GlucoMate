import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';
const DataEntryScreen = () => {
  const [date, setDate] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState('Lunch');
  const [time, setTime] = useState(getCurrentTime());
  const [wieght, setWeight] = useState('');
  const [glucoseLevel, setGlucoseLevel] = useState('');
  const [insulin, setInsulin] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeOfDayPicker, setShowTimeOfDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [carbohydrates, setCarbohydrates] = useState('');
  const [activity, setActivity] = useState('');
  const [systolicPressure, setSystolicPressure] = useState('');
  const [diastolicPressure, setDiastolicPressure] = useState('');
  const timeOfDayOptions = ['Przed Śniadaniem', 'Śniadanie ', 'Po Śniadaniu', 'Przed Obiadem', 'Obiad ', 'Po Obiedzie', 'Przed Kolacją', 'Kolacja', 'Po Kolacji'];
  const timeOfDayPickerRef = useRef();
  useEffect(() => {
    updateTimeOfDay();
  }, []);
  const updateTimeOfDay = () => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = getTimeOfDay(hour);
    setTimeOfDay(timeOfDay);
  };
  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  //czasami sa błedy a czasmi działa
  const getTimeOfDay = (hour) => {
    if (hour >= 5 && hour < 8) {
      return 'Przed Śniadaniem';
    } else if (hour >= 8 && hour < 11) {
      return 'Śniadanie';
    } else if (hour >= 11 && hour < 12) {
      return 'Po Śniadaniu';
    } else if (hour >= 13 && hour < 14) {
      return 'Przed Obiadem';
    } else if (hour >= 15 && hour < 18) {
      return 'Obiad';
    } else if (hour >= 19 && hour < 20) {
      return 'Po Obiedzie';
    } else if (hour >= 21 && hour < 23) {
      return 'Przed Kolacją';
    } else if (hour == 24) {
      return 'Kolacja';
    }
  };
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateTimeOfDay();
    }, 60000); 

    
    return () => clearInterval(intervalId);
  }, []);
// juz działa
  useEffect(() => {
    updateTimeOfDay();
  }, [date]);

  const firebaseConfig = {
    apiKey: "AIzaSyCYiVYps34JN6oS3l93_JQWjCuAMXiG-48",
    authDomain: "inzynierka-90015.firebaseapp.com",
    projectId: "inzynierka-90015",
    storageBucket: "inzynierka-90015.appspot.com",
    messagingSenderId: "525006852034",
    appId: "1:525006852034:web:edad1ee71de528cf40d05b",
    measurementId: "G-41BG9GE6JL"
  };

  const app = initializeApp(firebaseConfig);

  const db = getFirestore(app);

  const handleSave = async () => {
    
    if (glucoseLevel < 30 || glucoseLevel > 300) {
      alert('Wartość glukozy jest niepoprawna. Wprowadź wartość od 30 do 300 mg/dL');
      return;
    }
    if (insulin < 0 || insulin > 50) {
      alert('Wartość insuliny jest niepoprawna. Wprowadź wartość od 0 do 50 U');
      return;
    }
    if (wieght < 0 || wieght > 300) {
      alert('Wartość wagi jest niepoprawna. Wprowadź wartość od 0 do 300 kg');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "entries"), {
        date: date,
        timeOfDay: timeOfDay,
        time: time,
        glucoseLevel: glucoseLevel,
        insulin: insulin,
        carbohydrates: carbohydrates,
        wieght: wieght,
        systolicPressure: systolicPressure,
        diastolicPressure: diastolicPressure,
        activity: activity,
      });
      console.log("Data saved with ID: ", docRef.id);
    } catch (error) {
      console.error("Error writing document: ", error);
    };
  
    
    setDate(new Date());
    setTimeOfDay(getTimeOfDay());
    setTime(getCurrentTime());
    setGlucoseLevel('');
    setInsulin('');
    setCarbohydrates('');
    setWeight('');
    setSystolicPressure('');
    setDiastolicPressure('');
    setActivity('');
  };
  // juz działa
  const handleRESET = () => {


    setDate(new Date());
    setTimeOfDay(getTimeOfDay());
    setTime(getCurrentTime());
    setGlucoseLevel('');
    setInsulin('');
    setCarbohydrates('');
    setWeight('');
    setSystolicPressure('');
    setDiastolicPressure('');
    setActivity('');

  };

  const handleOpenPicker = (pickerType) => {
    if (pickerType === "date") {
      setShowDatePicker(true);
      setShowTimeOfDayPicker(false);
      setShowTimePicker(false);
    } else if (pickerType === "timeOfDay") {
      setShowTimeOfDayPicker(true);
      setShowDatePicker(false);
      setShowTimePicker(false);
    } else if (pickerType === "time") {
      setShowTimePicker(true);
      setShowDatePicker(false);
      setShowTimeOfDayPicker(false);
    }
  };
  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  };

  const onTimeOfDayChange = (itemValue) => {
    setTimeOfDay(itemValue);
    timeOfDayPickerRef.current.blur();
  };

  const onTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
    } else {
      setShowTimePicker(false);
      if (selectedTime) {
        const hours = selectedTime.getHours().toString().padStart(2, '0');
        const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
        setTime(`${hours}:${minutes}`);
      }
    }
  };
  return (

    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.containerInner}>
        <TouchableOpacity style={styles.row} onPress={() => handleOpenPicker("date")}>
          {showDatePicker ? (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              style={styles.datePicker}
            />
          ) : (
            <>
              <Icon name="calendar" size={20} color="#000" />
              <Text style={styles.rowText}>Data</Text>
              <TouchableOpacity style={styles.rowValue} onPress={() => setShowDatePicker(true)}>
                <Text>{date.toLocaleDateString('pl-PL')}</Text>
              </TouchableOpacity>
            </>
          )}
          {showDatePicker && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDatePicker(false)}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => handleOpenPicker("timeOfDay")}>
          <>
            <Icon name="tag" size={20} color="#000" />
            <Text style={styles.rowText}>Pora Dnia</Text>
            <TouchableOpacity style={styles.rowValue} onPress={() => setShowTimeOfDayPicker(true)}>
              <Text>{timeOfDay}</Text>
            </TouchableOpacity>
          </>
          {showTimeOfDayPicker && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTimeOfDayPicker(false)}
            >
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => handleOpenPicker("time")}>
          <>
            <Icon name="clock-o" size={20} color="#000" />
            <Text style={styles.rowText}>Godzina</Text>
            <TouchableOpacity style={styles.rowValue} onPress={() => setShowTimePicker(true)}>
              <Text>{time}</Text>
            </TouchableOpacity>
          </>
          {showTimePicker && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.row}>
          <Icon name="tint" size={20} color="#000" />
          <Text style={styles.rowText}>Glukoza</Text>
          <TextInput
            style={styles.rowValue1}
            value={glucoseLevel}
            onChangeText={setGlucoseLevel}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#888" 
          />
          <Text style={styles.unit}>mg/dL </Text>
        </View>

        <View style={styles.row}>
          <Icon name="eyedropper" size={20} color="#000" />
          <Text style={styles.rowText}>Insulina</Text>
          <TextInput
            style={styles.rowValue1}
            value={insulin}
            onChangeText={setInsulin}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#888" 
          />
          <Text style={styles.unit}>   U      </Text>
        </View>
        <View style={styles.row}>
          <Icon name="cube" size={20} color="#000" />
          <Text style={styles.rowText}>Węglowodany</Text>
          <TextInput
            style={styles.rowValue1}
            value={carbohydrates}
            onChangeText={setCarbohydrates}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#888"
          />
          <Text style={styles.unit}>  g       </Text>

        </View>
        <View style={styles.row}>
          <Icon name="bicycle" size={20} color="#000" />
          <Text style={styles.rowText}>Aktywność</Text>
          <TextInput
            style={styles.rowValue1}
            value={activity}
            onChangeText={setActivity}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#888"
          />
          <Text style={styles.unit}>  minut</Text>

        </View>
        <View style={styles.row}>
          <Icon name="balance-scale" size={20} color="#000" />
          <Text style={styles.rowText}>Masa Ciała</Text>
          <TextInput
            style={styles.rowValue1}
            value={wieght}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#888" 
          />
          <Text style={styles.unit}>  kg     </Text>

        </View>

        <View style={styles.row}>
          <Icon name="heartbeat" size={20} color="#000" />
          <View style={styles.inputContainer}>
            <Text style={styles.rowText}>Ciśnienie</Text>
            <TextInput
              style={styles.rowValue2}
              value={systolicPressure}
              onChangeText={setSystolicPressure}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#888" 
            />
            <Text style={styles.unit}>mmHG </Text>
            <TextInput
              style={styles.rowValue2}
              value={diastolicPressure}
              onChangeText={setDiastolicPressure}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#888" 
            />
            <Text style={styles.unit}>mmHG</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>ZAPISZ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleRESET}>
          <Text style={styles.buttonText}>RESET</Text>
        </TouchableOpacity>
      </View>


      {showTimeOfDayPicker && (
        <View style={styles.pickerContainer}>
          <Picker
            style={styles.picker}
            selectedValue={timeOfDay}
            onValueChange={onTimeOfDayChange}
            ref={timeOfDayPickerRef}
          >
            {timeOfDayOptions.map((option) => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setShowTimeOfDayPicker(false)}
          >
            <Text style={styles.doneButtonText}>Zapisz</Text>
          </TouchableOpacity>

        </View>
      )}

      {showTimePicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="spinner"
            onChange={onTimeChange}
          />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setShowTimePicker(false)}
          >
            <Text style={styles.doneButtonText}>Zapisz</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25a3c2',
    paddingVertical: 20,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f2f2f2'
  },
  containerInner: {
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    marginBottom: 10,
  },
  unit: {
    color: '#808080',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  rowText: {
    marginLeft: 10,
    flex: 1,
    color: 'black'
  },
  rowValue: {
    flex: 1,
    padding: 10,
    paddingRight: 5, 
    borderWidth: 1,
    borderColor: '#25a3c2',
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#808080',
    marginRight: 5,
    justifyContent: 'center',
    textAlign: 'center',
  },
  rowValue1: {
    flex: 0.25,
    padding: 10,
    paddingRight: 5, 
    borderWidth: 1,
    borderColor: '#25a3c2',
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#808080',
    marginRight: 5, 
    justifyContent: 'center',
    textAlign: 'center',
  },
  rowValue2: {
    flex: 0.4,
    padding: 10,
    paddingRight: 5, 
    borderWidth: 1,
    borderColor: '#25a3c2',
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#808080',
    marginRight: 5,
    textAlign: 'center',
  },
  pressureInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  pressureLabel: {
    marginRight: 10,
    color: 'black',
    fontSize: 16,
  },
  
  datePicker: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#25a3c2',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeOfDayPicker: {
    flex: 1,
    height: 150,
    position: 'absolute',
    backgroundColor: '#fff',
    width: '100%',
    zIndex: 1,
    top: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0, 
    left: 0,
    right: 0, 
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#8F8F8F'
  },
  doneButton: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#25a3c2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopRightRadius: 4, 
    borderBottomLeftRadius: 4,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});


export default DataEntryScreen;
