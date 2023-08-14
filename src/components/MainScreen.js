import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { requestForegroundPermissionsAsync, getCurrentPositionAsync } from 'expo-location';
import { getFirestore, onSnapshot, collection, query, orderBy, limit, where, getDocs,doc } from "firebase/firestore";
import { initializeApp } from 'firebase/app';


const MainScreen = () => {
  const [showStatisticsValue, setShowStatisticsValue] = useState(0);
  const showStatistics = useRef(new Animated.Value(0)).current;
  const [circle0Scale] = useState(new Animated.Value(0));
  const [circle1Scale] = useState(new Animated.Value(0));
  const [circle2Scale] = useState(new Animated.Value(0));
  const [emergencyContact, setEmergencyContact] = useState('');
  const [lastDate, setLastDate] = useState(null);
  const [lastGlucose, setLastGlucose] = useState(null);
  const [lastCarb, setLastCarb] = useState(null);
  const [lastInsulin, setLastInsulin] = useState(null);
  const [dailyStats, setDailyStats] = useState({ calories: 0, carbs: 0, insulin: 0, glucose: 0, wieght: 0 });
  const [weeklyStats, setWeeklyStats] = useState({ calories: 0, carbs: 0, insulin: 0, glucose: 0, wieght: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ calories: 0, carbs: 0, insulin: 0, glucose: 0, wieght: 0 });
  const [a1c, setA1c] = useState(null);
  const [isLantusPressed, setIsLantusPressed] = useState(false);
  function roundToFixed(number, decimalPlaces) {
    const factor = 10 ** decimalPlaces;
    return (Math.round(number * factor) / factor).toFixed(decimalPlaces);
  }

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
  
  useEffect(() => {
    const calculateA1c = async () => {
      const a1cQuery = query(
        collection(db, 'entries'),
        orderBy('date', 'desc'),
        limit(90)
      );

      const unsubscribeA1c = onSnapshot(a1cQuery, (snapshot) => {
        const glucoseLevels = [];
        snapshot.forEach((doc) => {
          glucoseLevels.push(parseFloat(doc.data().glucoseLevel));
        });

        const sum = glucoseLevels.reduce((a, b) => a + b, 0);
        const avgGlucose = sum / glucoseLevels.length;
        const a1c = (avgGlucose + 46.7) / 28.7;
        setA1c(a1c.toFixed(1));
      });

      return () => unsubscribeA1c();
    };

    calculateA1c();
  }, []);


  useEffect(() => {
    const q = query(collection(db, "entries"), orderBy("date", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = [];
      snapshot.forEach((doc) => {
        entries.push({
          ...doc.data(),
          date: new Date(doc.data().date.seconds * 1000).toLocaleString(),
        });
      });
      const lastEntry = entries[0];
      if (lastEntry) {
        setLastDate(lastEntry.date);
        setLastGlucose(lastEntry.glucoseLevel);
        setLastInsulin(lastEntry.insulin);
        setLastCarb(lastEntry.carbohydrates);
      }

    });

    return () => unsubscribe();
  }, []);
  const getGlucoseLevelColor = (glucoseLevel) => {
    let color = 'white'; // domyślny kolors


    if (glucoseLevel < 70) {
      color = '#B9Bfff'; // niski poziom
    } else if (glucoseLevel >= 70 && glucoseLevel <= 180) {
      color = '#67ba6a'; // normalny poziom
    } else if (glucoseLevel > 180) {
      color = '#f7a446'; // wysoki poziom
    }

    return color;
  };
  const getEntriesForDate = async (date) => {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000));

    const entriesQuery = query(
      collection(db, 'entries'),
      where('date', '>=', startOfDay),
      where('date', '<', endOfDay)
    );

    const querySnapshot = await getDocs(entriesQuery);

    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data());
    });

    return entries;
  };
  const getEntriesForWeek = async (date) => {
    const startOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek.getTime() + (7 * 24 * 60 * 60 * 1000));

    const entriesQuery = query(
      collection(db, 'entries'),
      where('date', '>=', startOfWeek),
      where('date', '<', endOfWeek)
    );

    const querySnapshot = await getDocs(entriesQuery);

    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data());
    });

    return entries;
  };

  const getEntriesForMonth = async (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

    const entriesQuery = query(
      collection(db, 'entries'),
      where('date', '>=', startOfMonth),
      where('date', '<', endOfMonth)
    );

    const querySnapshot = await getDocs(entriesQuery);

    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data());
    });

    return entries;
  };
  const sumDailyStats = (entries) => {
    let sumCalories = 0;
    let sumCarbs = 0;
    let sumInsulin = 0;
    let sumGlucose = 0;
    let sumWeight = 0;
    let sumActivity = 0;

    entries.forEach((entry) => {
      const carbs = parseFloat(entry.carbohydrates) || 0;
      sumCalories += carbs * 4;
      sumCarbs += carbs;
      sumInsulin += parseFloat(entry.insulin) || 0;
      sumGlucose += parseFloat(entry.glucoseLevel) || 0;
      sumWeight += parseFloat(entry.wieght) || 0;
      sumActivity += parseFloat(entry.activity) || 0;
    });

    const avgGlucose = entries.length > 0 ? sumGlucose / entries.length : 0;
    const avgWeight = entries.length > 0 ? sumWeight / entries.length : 0;

    return {
      calories: sumCalories,
      carbohydrates: sumCarbs,
      insulin: sumInsulin,
      glucoseLevel: avgGlucose,
      wieght: avgWeight,
      activity: sumActivity,
    };
  };
  useEffect(() => {
    const fetchAndSetDailyStats = async () => {
      const today = new Date();
      const dailyEntries = await getEntriesForDate(today);
      const dailyStats = sumDailyStats(dailyEntries);
      setDailyStats(dailyStats);
    };

    const fetchAndSetWeeklyStats = async () => {
      const today = new Date();
      const weeklyEntries = await getEntriesForWeek(today);
      const weeklyStats = sumDailyStats(weeklyEntries);
      setWeeklyStats(weeklyStats);
    };

    const fetchAndSetMonthlyStats = async () => {
      const today = new Date();
      const monthlyEntries = await getEntriesForMonth(today);
      const monthlyStats = sumDailyStats(monthlyEntries);
      setMonthlyStats(monthlyStats);
    };

    // // juz działa
    fetchAndSetDailyStats();
    fetchAndSetWeeklyStats();
    fetchAndSetMonthlyStats();

    const startOfDay = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000));

    const startOfWeek = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), startOfDay.getDate() - startOfDay.getDay());
    const endOfWeek = new Date(startOfWeek.getTime() + (7 * 24 * 60 * 60 * 1000));

    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

    //
    const dailyEntriesQuery = query(
      collection(db, 'entries'),
      where('date', '>=', startOfDay),
      where('date', '<', endOfDay)
    );

    const unsubscribeDaily = onSnapshot(dailyEntriesQuery, () => {
      fetchAndSetDailyStats();
    });

    // 
    const weeklyEntriesQuery = query(
      collection(db, 'entries'),
      where('date', '>=', startOfWeek),
      where('date', '<', endOfWeek)
    );

    const unsubscribeWeekly = onSnapshot(weeklyEntriesQuery, () => {
      fetchAndSetWeeklyStats();
    });

    //// juz działa
    const monthlyEntriesQuery = query(
      collection(db, 'entries'),
      where('date', '>=', startOfMonth),
      where('date', '<', endOfMonth)
    );

    const unsubscribeMonthly = onSnapshot(monthlyEntriesQuery, () => {
      fetchAndSetMonthlyStats();
    });

    // Ustal timer, który wywoła funkcję ponownie o północy.
    const now = new Date();
    const tillMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timerId = setTimeout(fetchAndSetDailyStats, tillMidnight);

    // Kiedy komponent jest odmontowywany, anuluj timer.
    return () => {
      clearTimeout(timerId);
      unsubscribeDaily();
      unsubscribeWeekly();
      unsubscribeMonthly();
    };
  }, []);

// juz działa

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerValue, setTimerValue] = useState('60');

  const handleLantusPress = () => {
    setIsLantusPressed(!isLantusPressed);
    if (!isLantusPressed) { // Sprawdzenie, czy przycisk jest naciśnięty
      Alert.alert(
        "Potwierdzenie",
        "Dawka insuliny została przyjęta",
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: "OK", onPress: () => console.log("OK Pressed") },
        ],
        { cancelable: false }
      );
    }
  };
// juz działa


  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerValue(60);
  };
  useEffect(() => {
    let timer;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimerValue(prevValue => prevValue - 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }

    return () => {
      clearInterval(timer);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (timerValue === 0) {
      Alert.alert('Hypoglikemia', 'Należy podjąć odpowiednie działania.');
      setIsTimerRunning(false);
    }
  }, [timerValue]);
  const toggleTimer = () => {
    if (isTimerRunning) {
      Alert.alert(
        'Czy chcesz anulować timer?',
        'Anulowanie spowoduje zatrzymanie odliczania.',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Zatrzymaj', onPress: stopTimer },
        ]
      );
    } else {
      startTimer();
    }
  };
  const docRef = doc(db, "personal_information", "unique_user_id");
  useEffect(() => {
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();

        setEmergencyContact(data.emergencyContact);

      } else {
        console.log("No such document!");
      }
    });

    return () => unsubscribe();
  }, []);
  
  const openMessageApp = async () => {
    const phoneNumber = emergencyContact;

    let { status } = await requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.error('Location permission not granted');
      return;
    }

    try {
      let location = await getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      const message = `Aktualnie mam BARDZO NISKI POZIOM GLUKOZY - Znajduje się - Lokalizacja: ${latitude}, ${longitude}`;
      const url = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
      Linking.openURL(url);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

// juz działa ale sa tylko szerokos i długosc

  const handleStatisticsPress = () => {
    Animated.timing(showStatistics, {
      toValue: showStatisticsValue === 0 ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();


    setShowStatisticsValue(showStatisticsValue === 0 ? 1 : 0);
  };

  const statisticsHeight = showStatistics.interpolate({
    inputRange: [0, 1],
    outputRange: ['1%', '85%'],
  });



  const handleScroll = (event) => {
    if (event.nativeEvent.contentOffset.y < -28) { // Zmienić na  wartość 28
      handleStatisticsPress();
    }
  };


  useEffect(() => {
    const animateCircles = () => {
      Animated.parallel([
        Animated.timing(circle0Scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(circle1Scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(circle2Scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    };

    animateCircles();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>




      {/* Treść ekranu */}
      <View style={{ flex: 1 }}>
        {/* Container 0 */}
        <View style={styles.container0}>
          <Text style={styles.lastMeasurementText}>
            OSTATNI POMIAR: {lastDate || '- -'}
          </Text>
        </View>

        {/* Container 1 */}
        <View style={[styles.container1, { justifyContent: 'center' }]}>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.circle0,
                { transform: [{ scale: circle0Scale }] },
                { backgroundColor: getGlucoseLevelColor(lastGlucose) },
              ]}
            >
              <Text style={styles.circleText}>{lastGlucose || '-'}</Text>
              <Text style={styles.circleSubText}>mg/dL</Text>
            </Animated.View>
            <Text style={styles.circleLabel}>Glukoza</Text>

          </View>
          <View style={styles.ringContainer}>
            <Animated.View
              style={[
                styles.ring,
                { transform: [{ scale: circle1Scale }] },
              ]}
            ></Animated.View>
            <Animated.View
              style={[
                styles.circle1,
                { transform: [{ scale: circle1Scale }] },
              ]}
            >
              <Text style={styles.circleText}>{a1c || '-'}</Text>
            </Animated.View>
            <Text style={styles.circleLabel}>A1c</Text>
          </View>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.circle2,
                { transform: [{ scale: circle2Scale }] },
              ]}
            >
              <Text style={styles.circleText}>
                {lastInsulin || '-'}
              </Text>
              <Text style={styles.circleSubText}>U</Text>
            </Animated.View>
            <Text style={styles.circleLabel}>Insulina</Text>
          </View>
        </View>



        {/* Container 2 */}
        <View style={styles.container2}>

          {/* Ikony */}
          <TouchableOpacity
            onPress={handleLantusPress}
            style={[
              styles.iconButton,
              isLantusPressed && styles.iconButtonActive,
            ]}
          >
            <Ionicons name="notifications-sharp" size={36} color={isLantusPressed ? '#e8e8e8' : '#25a3c2'} />
            <Text style={[styles.iconLabel, isLantusPressed && styles.iconLabelActive]}>LANTUS</Text>
          </TouchableOpacity>


          <View style={styles.iconButton}>
            <TouchableOpacity onPress={toggleTimer} style={styles.timerButton}>
              {isTimerRunning ? (
                <Text style={styles.timerText}>{timerValue}</Text>
              ) : (
                <Ionicons name="timer-outline" size={36} color="white" />
              )}
            </TouchableOpacity>
            <Text style={styles.iconLabel}>ALARM</Text>
          </View>
          {/* Icon 3 */}
          <TouchableOpacity style={styles.iconButton} onPress={openMessageApp}>
            <Ionicons name="chatbox-outline" size={36} color="#25a3c2" />
            <Text style={styles.iconLabel}>POMOC</Text>
          </TouchableOpacity>


        </View>
        <TouchableOpacity
          style={styles.statisticsButton1}
          onPress={handleStatisticsPress}
        >
          <Text style={styles.statisticsButtonText}>
            {showStatisticsValue ? 'ZWIŃ' : 'STATYSTYKI'}
          </Text>
        </TouchableOpacity>


      </View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: statisticsHeight,
          backgroundColor: 'white',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          padding: 1,

        }}
      >
        {/* Statystystki*/}
        <View style={styles.bottomContainer}>
          <ScrollView
            scrollEventThrottle={16}
            onScroll={handleScroll}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>DZISAJ</Text>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Kalorie:</Text>
                <Text style={styles.metric}>{dailyStats.calories} kcal </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Węglowodany:</Text>
                <Text style={styles.metric}>{dailyStats.carbohydrates} g </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Insulina:</Text>
                <Text style={styles.metric}>{dailyStats.insulin} U </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Średni poziom glukozy:</Text>
                <Text style={styles.metric}>{roundToFixed(dailyStats.glucoseLevel, 2)} mg/dL </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Średnia masa ciała :</Text>
                <Text style={styles.metric}>{roundToFixed(dailyStats.wieght, 2)} kg</Text>
              </View>
              <View style={styles.entry}>
                <Text style={styles.entryText}>Aktywność:</Text>
                <Text style={styles.metric}>{dailyStats.activity} minut</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>W TYM TYGODNIU</Text>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Kalorie:</Text>
                <Text style={styles.metric}>{weeklyStats.calories} kcal </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Węglowodany:</Text>
                <Text style={styles.metric}>{weeklyStats.carbohydrates} g </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Insulina:</Text>
                <Text style={styles.metric}>{weeklyStats.insulin} U </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Średni poziom glukozy:</Text>
                <Text style={styles.metric}>{roundToFixed(weeklyStats.glucoseLevel, 2)} mg/dL </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Średnia masa ciała :</Text>
                <Text style={styles.metric}>{roundToFixed(weeklyStats.wieght, 2)} kg</Text>
              </View>
              <View style={styles.entry}>
                <Text style={styles.entryText}>Aktywność:</Text>
                <Text style={styles.metric}>{weeklyStats.activity} minut</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>W TYM MIESIĄCU</Text>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Kalorie:</Text>
                <Text style={styles.metric}>{monthlyStats.calories} kcal </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Węglowodany:</Text>
                <Text style={styles.metric}>{monthlyStats.carbohydrates} g </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Insulina:</Text>
                <Text style={styles.metric}>{monthlyStats.insulin} U </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Średni poziom glukozy:</Text>
                <Text style={styles.metric}>{roundToFixed(monthlyStats.glucoseLevel, 2)} mg/dL </Text>
              </View>

              <View style={styles.entry}>
                <Text style={styles.entryText}>Średnia masa ciała :</Text>
                <Text style={styles.metric}>{roundToFixed(monthlyStats.wieght, 2)} kg</Text>
              </View>
              <View style={styles.entry}>
                <Text style={styles.entryText}>Aktywność:</Text>
                <Text style={styles.metric}>{monthlyStats.activity} minut</Text>
              </View>
            </View>
          </ScrollView>
        </View>


      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({

  container0: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    margin: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  container1: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    margin: 10,
    padding: 25,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  container2: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  titleText: {
    color: 'green',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    marginRight: 20,
    marginTop: 10,
  },
  ringContainer: {
    alignItems: 'center',
    marginRight: 20,
    marginTop: 5,
    position: 'relative',
  },
  circle0: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#25a3c2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  circle1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#67ba6a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  circle2: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#67ba6a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  circleText: {
    color: 'white',
    fontSize: 24,
  },
  circleSubText: {
    color: 'white',
    fontSize: 12,
  },
  circleLabel: {
    color: '#1c7d94',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 20,
  },
  buttonContainer: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#25a3c2',
    borderWidth: 12,
    borderColor: '#e8e8e8',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lastMeasurementText: {
    color: '#25a3c2',
    fontSize: 15,
  },
  iconButton: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  iconLabel: {
    color: '#25a3c2',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 5,
  },
  middleText: {
    color: '#25a3c2',
    fontSize: 15,
    marginTop: 10,
  },
  middleText2: {
    color: '#67ba6a',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  bottomContainer: {
    flexGrow: 1,
    backgroundColor: '#f2f2f2',
    // padding: 15,

    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,

  },
  timerButton: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: '#25a3c2',
    justifyContent: 'center',
    alignItems: 'center',

  },
  timerText: {
    fontSize: 20,
    color: '#67ba6a',
    fontWeight: 'bold',
  },
  timerCancelText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconButtonActive: {
    opacity: 0.5,
  },
  iconLabelActive: {
    color: '#25a3c2',
  },
  statisticsButton: {
    backgroundColor: '#25a3c2',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 90,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  statisticsButton1: {
    backgroundColor: '#25a3c2',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  statisticsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  table: {
    borderWidth: 1,
    borderColor: 'white',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'white',
    padding: 10,
  },
  statisticsButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statisticsButton: {
    backgroundColor: '#0000ff',
    color: '#ffffff',
  },
  tableContainer: {
    marginBottom: 20,
  },
  subTableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    position: 'relative',
  },
  cardTitle: {
    marginBottom: 10,
    color: 'grey',
    fontSize: 18,
    fontWeight: 'bold',
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  entryText: {
    color: '#25a3c2',
    fontSize: 16,
  },
  metric: {
    color: '#25a3c2',
  }

});

export default MainScreen;
