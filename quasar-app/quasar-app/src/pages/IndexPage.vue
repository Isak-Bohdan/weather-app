<template>
  <q-page
    class="flex column"
    :class="bgClass"
    :style="{ filter: backgroundFilter }"
  >
    <div class="col q-pt-lg q-px-md">
      <!-- Кнопка-перемикач мов -->
      <q-btn-toggle
        v-model="language"
        class="my-custom-toggle"
        no-caps
        rounded
        unelevated
        toggle-color="accent"
        color="white"
        text-color="primary"
        :options="[
          { label: 'EN', value: 'en' },
          { label: 'УКР', value: 'uk' },
        ]"
        @update:model-value="toggleLanguage"
      />
      <q-input
        v-model="search"
        placeholder="Search"
        @keydown.enter="getWeatherBySearch"
        dark
        borderless
      >
        <template v-slot:before>
          <q-icon name="my_location" @click="getLocation" />
        </template>
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            @click="getWeatherBySearch"
            :disabled="isLoading"
          />
        </template>
      </q-input>
    </div>

    <!-- Виведення погоди -->
    <template v-if="weatherData">
      <div class="col text-center" :class="textColorClass">
        <div class="text-h4 text-weight-light">
          {{ weatherData.city?.name }}
        </div>
        <div class="text-h6 text-weight-light">
          {{ t.cloudiness }}: {{ weatherData.list[0]?.clouds?.all || "0" }}%
        </div>
        <div class="text-h1 text-weight-thin">
          {{ Math.round(weatherData.list[0]?.main?.temp) || "--" }}&deg;
        </div>
        <div class="text-subtitle1">{{ t.time }}: {{ localTime }}</div>
        <div class="text-subtitle1">{{ t.fog }}: {{ visibility }} m</div>
        <div class="text-subtitle1">{{ t.humidity }}: {{ humidity }}%</div>
        <div class="col text-center">
          <img
            :src="`http://openweathermap.org/img/wn/${weatherData.list[0]?.weather?.[0]?.icon}.png`"
            alt="Weather Icon"
          />
        </div>
         <!-- Кнопка для повернення на головний екран -->
        <q-btn
          class="q-mt-md text-white"
          :class="backButtonClass"
          icon="arrow_back"
          :label="t.backToHome"
          @click="resetToHome"
        />
      </div>
    </template>

    <!-- Якщо погода не знайдена -->
    <template v-else>
      <div class="col column text-center text-white">
        <div class="col text-h2 text-weight-thin">
          {{ t.weatherApp }}
        </div>
        <q-btn @click="getLocation" color="white" flat>
          <q-icon left size="3em" name="my_location" />
          <div>{{ t.findLocation }}</div>
        </q-btn>
      </div>
    </template>

    <div class="col skyline"></div>
  </q-page>
</template>

<script setup>
import { translations } from "src/router/localization";
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { Notify } from "quasar"; // Імпортуємо плагін Notify

const toggleLanguage = (newLang) => {
  language.value = newLang;
};

const language = ref("en"); // Поточна мова
const t = computed(() => translations[language.value]); // Обираємо правильний набір текстів

const search = ref("");
const weatherData = ref(null);
const lat = ref(null);
const lon = ref(null);
const apiUrl = "https://api.openweathermap.org/data/2.5/forecast";
const apiKey = "77d4961a82e037c80e95242cf1ba21d4";

// Виведення локального часу
const localTime = computed(() => {
  if (weatherData.value) {
    const timezoneOffset = weatherData.value.city.timezone;
    const utcTime = Date.now() + timezoneOffset * 1000;
    const date = new Date(utcTime);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return "--:--";
});

// Підготовка даних по вологісті та видимості
const visibility = computed(
  () => weatherData.value?.list[0]?.visibility || "N/A"
);
const humidity = computed(
  () => weatherData.value?.list[0]?.main?.humidity || "N/A"
);

const getWeatherByCoords = async () => {
  if (lat.value !== null && lon.value !== null) {
    try {
      const response = await axios.get(
        `${apiUrl}?lat=${lat.value}&lon=${lon.value}&appid=${apiKey}&units=metric`
      );
      console.log("Weather Data:", response.data);
      weatherData.value = response.data;
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  }
};

const getLocation = async () => {
  if (navigator.geolocation) {
    try {
      // Отримання координат користувача
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          lat.value = position.coords.latitude;
          lon.value = position.coords.longitude;
          await getWeatherByCoords(); // Отримуємо погоду за координатами
        },
        (error) => {
          Notify.create({
            color: "negative",
            position: "top",
            message: t.value.locationError || "Unable to retrieve location",
            icon: "warning",
          });
        }
      );
    } catch (error) {
      console.error("Error getting location:", error);
    }
  } else {
    Notify.create({
      color: "negative",
      position: "top",
      message:
        t.value.locationError || "Geolocation is not supported by this browser",
      icon: "warning",
    });
  }
};

// Отримання погоди за пошуком
const getWeatherBySearch = async () => {
  if (search.value.trim() !== "") {
    isLoading.value = true; // Початок завантаження
    try {
      const response = await axios.get(
        `${apiUrl}?q=${search.value}&appid=${apiKey}&units=metric`
      );
      console.log("Weather Data:", response.data);
      weatherData.value = response.data;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Виведення повідомлення при помилці
      Notify.create({
        color: "negative",
        position: "top",
        message: t.value.cityNotFound || "City not found",
        icon: "warning",
      });
    } finally {
      isLoading.value = false; // Завершення завантаження
    }
  } else {
    console.log("Please enter a city name");
    isLoading.value = false; // Завершення завантаження, якщо немає введеного міста
  }
};

// Стилі для фону
const bgClass = computed(() => {
  if (weatherData.value) {
    const sunrise = weatherData.value.city.sunrise * 1000;
    const sunset = weatherData.value.city.sunset * 1000;
    const currentTime = Date.now();
    return currentTime >= sunrise && currentTime <= sunset
      ? "bg-day"
      : "bg-night";
  }
  return "q-page";
});

// Фільтрація яскравості фону
const backgroundFilter = computed(() => {
  if (!weatherData.value) return "brightness(1)";
  const timezoneOffset = weatherData.value.city.timezone;
  const utcTime = Date.now() + timezoneOffset * 1000;
  const hours = new Date(utcTime).getUTCHours();
  if (hours >= 0 && hours < 6) return "brightness(0.7)";
  if (hours >= 6 && hours < 8) return "brightness(0.9)";
  if (hours >= 18 && hours < 20) return "brightness(0.8)";
  if (hours >= 20 || hours < 0) return "brightness(0.7)";
  return "brightness(1)";
});

// Визначення кольору тексту в залежності від часу дня
const textColorClass = computed(() => {
  if (!weatherData.value) return "text-white";
  const timezoneOffset = weatherData.value.city.timezone;
  const utcTime = Date.now() + timezoneOffset * 1000;
  const hours = new Date(utcTime).getUTCHours();
  return (hours >= 0 && hours < 6) || hours >= 20 ? "text-blue" : "text-white";
});

const isLoading = ref(false); // Додано для контролю стану завантаження

// Метод для повернення
const backButtonClass = computed(() => {
  if (!weatherData.value) return "bg-primary text-white";
  const now = Date.now();
  const { sunrise, sunset } = weatherData.value.city;
  return now >= sunrise * 1000 && now <= sunset * 1000
    ? "bg-gradient-day text-white"
    : "bg-gradient-night text-white";
});

const resetToHome = () => {
  weatherData.value = null;
  search.value = "";
};
</script>