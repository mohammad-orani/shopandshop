// ==================== COUNTRIES & CITIES DATA ====================
// Hybrid system: Uses database API when available, localStorage as fallback

// ==================== GET COUNTRIES WITH CITIES ====================

async function getCountriesWithCities() {
    // Try to get from API first
    if (typeof getDeliveryCountries === 'function') {
        try {
            const countries = await getDeliveryCountries();
            if (countries && countries.length > 0) {
                return countries;
            }
        } catch (error) {
            console.warn('API unavailable, using localStorage:', error);
        }
    }

    // Fallback to localStorage
    const data = localStorage.getItem('countriesWithCities');
    if (data) {
        return JSON.parse(data);
    }

    // Ultimate fallback: Default data
    return getDefaultCountries();
}

// ==================== DEFAULT COUNTRIES DATA ====================

// function getDefaultCountries() {
//     const defaultCountries = [
//         {
//             id: 1,
//             name_en: 'Jordan',
//             name_ar: 'الأردن',
//             phone_prefix: '+962',
//             phonePrefix: '+962',
//             default_fee: 0,
//             defaultFee: 0,
//             cities: [
//                 { id: 1, name_en: 'Amman', name_ar: 'عمان', delivery_fee: 0, fee: 0 },
//                 { id: 2, name_en: 'Zarqa', name_ar: 'الزرقاء', delivery_fee: 0, fee: 0 },
//                 { id: 3, name_en: 'Irbid', name_ar: 'إربد', delivery_fee: 0, fee: 0 },
//                 { id: 4, name_en: 'Aqaba', name_ar: 'العقبة', delivery_fee: 0, fee: 0 },
//                 { id: 5, name_en: 'Madaba', name_ar: 'مادبا', delivery_fee: 0, fee: 0 },
//                 { id: 6, name_en: 'Jerash', name_ar: 'جرش', delivery_fee: 0, fee: 0 },
//                 { id: 7, name_en: 'Ajloun', name_ar: 'عجلون', delivery_fee: 0, fee: 0 },
//                 { id: 8, name_en: 'Karak', name_ar: 'الكرك', delivery_fee: 0, fee: 0 },
//                 { id: 9, name_en: 'Mafraq', name_ar: 'المفرق', delivery_fee: 0, fee: 0 },
//                 { id: 10, name_en: 'Salt', name_ar: 'السلط', delivery_fee: 0, fee: 0 }
//             ]
//         },
//         {
//             id: 2,
//             name_en: 'Saudi Arabia',
//             name_ar: 'المملكة العربية السعودية',
//             phone_prefix: '+966',
//             phonePrefix: '+966',
//             default_fee: 15,
//             defaultFee: 15,
//             cities: [
//                 { id: 11, name_en: 'Riyadh', name_ar: 'الرياض', delivery_fee: 15, fee: 15 },
//                 { id: 12, name_en: 'Jeddah', name_ar: 'جدة', delivery_fee: 15, fee: 15 },
//                 { id: 13, name_en: 'Mecca', name_ar: 'مكة المكرمة', delivery_fee: 15, fee: 15 },
//                 { id: 14, name_en: 'Medina', name_ar: 'المدينة المنورة', delivery_fee: 15, fee: 15 },
//                 { id: 15, name_en: 'Dammam', name_ar: 'الدمام', delivery_fee: 15, fee: 15 },
//                 { id: 16, name_en: 'Khobar', name_ar: 'الخبر', delivery_fee: 15, fee: 15 },
//                 { id: 17, name_en: 'Tabuk', name_ar: 'تبوك', delivery_fee: 20, fee: 20 },
//                 { id: 18, name_en: 'Abha', name_ar: 'أبها', delivery_fee: 20, fee: 20 }
//             ]
//         },
//         {
//             id: 3,
//             name_en: 'United Arab Emirates',
//             name_ar: 'الإمارات العربية المتحدة',
//             phone_prefix: '+971',
//             phonePrefix: '+971',
//             default_fee: 20,
//             defaultFee: 20,
//             cities: [
//                 { id: 19, name_en: 'Dubai', name_ar: 'دبي', delivery_fee: 20, fee: 20 },
//                 { id: 20, name_en: 'Abu Dhabi', name_ar: 'أبو ظبي', delivery_fee: 20, fee: 20 },
//                 { id: 21, name_en: 'Sharjah', name_ar: 'الشارقة', delivery_fee: 20, fee: 20 },
//                 { id: 22, name_en: 'Ajman', name_ar: 'عجمان', delivery_fee: 20, fee: 20 },
//                 { id: 23, name_en: 'Ras Al Khaimah', name_ar: 'رأس الخيمة', delivery_fee: 20, fee: 20 },
//                 { id: 24, name_en: 'Fujairah', name_ar: 'الفجيرة', delivery_fee: 20, fee: 20 },
//                 { id: 25, name_en: 'Umm Al Quwain', name_ar: 'أم القيوين', delivery_fee: 20, fee: 20 }
//             ]
//         },
//         {
//             id: 4,
//             name_en: 'Kuwait',
//             name_ar: 'الكويت',
//             phone_prefix: '+965',
//             phonePrefix: '+965',
//             default_fee: 12,
//             defaultFee: 12,
//             cities: [
//                 { id: 26, name_en: 'Kuwait City', name_ar: 'مدينة الكويت', delivery_fee: 12, fee: 12 },
//                 { id: 27, name_en: 'Hawalli', name_ar: 'حولي', delivery_fee: 12, fee: 12 },
//                 { id: 28, name_en: 'Salmiya', name_ar: 'السالمية', delivery_fee: 12, fee: 12 },
//                 { id: 29, name_en: 'Farwaniya', name_ar: 'الفروانية', delivery_fee: 12, fee: 12 },
//                 { id: 30, name_en: 'Ahmadi', name_ar: 'الأحمدي', delivery_fee: 12, fee: 12 }
//             ]
//         },
//         {
//             id: 5,
//             name_en: 'Qatar',
//             name_ar: 'قطر',
//             phone_prefix: '+974',
//             phonePrefix: '+974',
//             default_fee: 18,
//             defaultFee: 18,
//             cities: [
//                 { id: 31, name_en: 'Doha', name_ar: 'الدوحة', delivery_fee: 18, fee: 18 },
//                 { id: 32, name_en: 'Al Rayyan', name_ar: 'الريان', delivery_fee: 18, fee: 18 },
//                 { id: 33, name_en: 'Al Wakrah', name_ar: 'الوكرة', delivery_fee: 18, fee: 18 },
//                 { id: 34, name_en: 'Al Khor', name_ar: 'الخور', delivery_fee: 18, fee: 18 }
//             ]
//         },
//         {
//             id: 6,
//             name_en: 'Bahrain',
//             name_ar: 'البحرين',
//             phone_prefix: '+973',
//             phonePrefix: '+973',
//             default_fee: 10,
//             defaultFee: 10,
//             cities: [
//                 { id: 35, name_en: 'Manama', name_ar: 'المنامة', delivery_fee: 10, fee: 10 },
//                 { id: 36, name_en: 'Muharraq', name_ar: 'المحرق', delivery_fee: 10, fee: 10 },
//                 { id: 37, name_en: 'Riffa', name_ar: 'الرفاع', delivery_fee: 10, fee: 10 },
//                 { id: 38, name_en: 'Hamad Town', name_ar: 'مدينة حمد', delivery_fee: 10, fee: 10 }
//             ]
//         },
//         {
//             id: 7,
//             name_en: 'Oman',
//             name_ar: 'عمان',
//             phone_prefix: '+968',
//             phonePrefix: '+968',
//             default_fee: 22,
//             defaultFee: 22,
//             cities: [
//                 { id: 39, name_en: 'Muscat', name_ar: 'مسقط', delivery_fee: 22, fee: 22 },
//                 { id: 40, name_en: 'Salalah', name_ar: 'صلالة', delivery_fee: 25, fee: 25 },
//                 { id: 41, name_en: 'Sohar', name_ar: 'صحار', delivery_fee: 22, fee: 22 },
//                 { id: 42, name_en: 'Nizwa', name_ar: 'نزوى', delivery_fee: 22, fee: 22 }
//             ]
//         },
//         {
//             id: 8,
//             name_en: 'Lebanon',
//             name_ar: 'لبنان',
//             phone_prefix: '+961',
//             phonePrefix: '+961',
//             default_fee: 8,
//             defaultFee: 8,
//             cities: [
//                 { id: 43, name_en: 'Beirut', name_ar: 'بيروت', delivery_fee: 8, fee: 8 },
//                 { id: 44, name_en: 'Tripoli', name_ar: 'طرابلس', delivery_fee: 8, fee: 8 },
//                 { id: 45, name_en: 'Sidon', name_ar: 'صيدا', delivery_fee: 8, fee: 8 },
//                 { id: 46, name_en: 'Tyre', name_ar: 'صور', delivery_fee: 8, fee: 8 }
//             ]
//         },
//         {
//             id: 9,
//             name_en: 'Palestine',
//             name_ar: 'فلسطين',
//             phone_prefix: '+970',
//             phonePrefix: '+970',
//             default_fee: 5,
//             defaultFee: 5,
//             cities: [
//                 { id: 47, name_en: 'Ramallah', name_ar: 'رام الله', delivery_fee: 5, fee: 5 },
//                 { id: 48, name_en: 'Nablus', name_ar: 'نابلس', delivery_fee: 5, fee: 5 },
//                 { id: 49, name_en: 'Hebron', name_ar: 'الخليل', delivery_fee: 5, fee: 5 },
//                 { id: 50, name_en: 'Gaza', name_ar: 'غزة', delivery_fee: 5, fee: 5 }
//             ]
//         },
//         {
//             id: 10,
//             name_en: 'Egypt',
//             name_ar: 'مصر',
//             phone_prefix: '+20',
//             phonePrefix: '+20',
//             default_fee: 10,
//             defaultFee: 10,
//             cities: [
//                 { id: 51, name_en: 'Cairo', name_ar: 'القاهرة', delivery_fee: 10, fee: 10 },
//                 { id: 52, name_en: 'Alexandria', name_ar: 'الإسكندرية', delivery_fee: 10, fee: 10 },
//                 { id: 53, name_en: 'Giza', name_ar: 'الجيزة', delivery_fee: 10, fee: 10 },
//                 { id: 54, name_en: 'Sharm El Sheikh', name_ar: 'شرم الشيخ', delivery_fee: 15, fee: 15 },
//                 { id: 55, name_en: 'Hurghada', name_ar: 'الغردقة', delivery_fee: 15, fee: 15 }
//             ]
//         }
//     ];

//     // Save to localStorage for future fallback
//     localStorage.setItem('countriesWithCities', JSON.stringify(defaultCountries));
//     return defaultCountries;
// }

// ==================== SAVE COUNTRIES ====================

function saveCountriesWithCities(countries) {
    localStorage.setItem('countriesWithCities', JSON.stringify(countries));
}

// ==================== GET CITIES BY COUNTRY ====================

async function getCitiesByCountry(countryId) {
    // Try API first
    if (typeof getDeliveryCities === 'function') {
        try {
            const cities = await getDeliveryCities(countryId);
            if (cities && cities.length > 0) {
                return cities;
            }
        } catch (error) {
            console.warn('API unavailable, using localStorage:', error);
        }
    }

    // Fallback to localStorage
    const countries = await getCountriesWithCities();
    const country = countries.find(c => String(c.id) === String(countryId));
    return country ? country.cities : [];
}

// ==================== GET DELIVERY FEE ====================

async function getDeliveryFee(countryId, cityId) {
    const cities = await getCitiesByCountry(countryId);
    const city = cities.find(c => String(c.id) === String(cityId));
    return city ? (city.delivery_fee || city.fee || 0) : 0;
}

// ==================== EXPORT FUNCTIONS ====================

if (typeof window !== 'undefined') {
    window.getCountriesWithCities = getCountriesWithCities;
    window.saveCountriesWithCities = saveCountriesWithCities;
    window.getCitiesByCountry = getCitiesByCountry;
    window.getDeliveryFee = getDeliveryFee;
    window.getDefaultCountries = getDefaultCountries;
}

console.log('✅ countries-data.js loaded - Hybrid mode (API + localStorage fallback)');