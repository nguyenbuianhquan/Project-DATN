import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
    family: 'Roboto',
    fonts: [
        { src: '/fonts/Roboto-Regular.ttf', fontWeight: 400 },
        { src: '/fonts/Roboto-Bold.ttf',    fontWeight: 700 },
    ],
});

const C = {
    primary:   '#f26f55',
    dark:      '#1a2035',
    gray:      '#6b7280',
    lightGray: '#f3f4f6',
    border:    '#e5e7eb',
};

const styles = StyleSheet.create({
    page:        { padding: 36, fontSize: 11, fontFamily: 'Roboto', fontWeight: 400, color: C.dark },

    // Header
    headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    brand:       { fontSize: 22, fontFamily: 'Roboto', fontWeight: 700, color: C.primary, letterSpacing: 1 },
    brandSub:    { fontSize: 9, color: C.gray, marginTop: 2 },
    invoiceBox:  { alignItems: 'flex-end' },
    invoiceTitle:{ fontSize: 14, fontFamily: 'Roboto', fontWeight: 700, color: C.dark },
    invoiceDate: { fontSize: 9, color: C.gray, marginTop: 3 },

    divider:     { borderBottomWidth: 1, borderBottomColor: C.primary, marginBottom: 18 },

    // Customer info
    infoSection: { flexDirection: 'row', gap: 32, marginBottom: 20 },
    infoBlock:   { flex: 1 },
    infoLabel:   { fontSize: 8, color: C.gray, textTransform: 'uppercase', marginBottom: 3, fontFamily: 'Roboto', fontWeight: 700 },
    infoValue:   { fontSize: 11, fontFamily: 'Roboto', fontWeight: 700, color: C.dark },
    infoSub:     { fontSize: 9, color: C.gray },

    // Table
    table:       { marginTop: 8 },
    tableHead:   { flexDirection: 'row', backgroundColor: C.dark, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 10 },
    tableHeadL:  { flex: 1, color: '#fff', fontSize: 9, fontFamily: 'Roboto', fontWeight: 700, textTransform: 'uppercase' },
    tableHeadR:  { width: 80, color: '#fff', fontSize: 9, fontFamily: 'Roboto', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' },

    tableRow:    { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    rowAlt:      { backgroundColor: C.lightGray },
    tableCell:   { flex: 1, fontSize: 10, color: C.dark },
    tableCellR:  { width: 80, fontSize: 10, textAlign: 'right', color: C.dark },

    totalSection:{ marginTop: 12, paddingTop: 10, borderTopWidth: 2, borderTopColor: C.primary, flexDirection: 'row', justifyContent: 'flex-end' },
    totalLabel:  { fontSize: 12, fontFamily: 'Roboto', fontWeight: 700, marginRight: 24, color: C.dark },
    totalValue:  { fontSize: 14, fontFamily: 'Roboto', fontWeight: 700, color: C.primary },

    // Footer
    footer:      { marginTop: 36, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
    footerText:  { fontSize: 8, color: C.gray },
    footerNote:  { fontSize: 9, color: C.gray, fontFamily: 'Roboto', fontWeight: 700 },
});

const Row = ({ label, value, alt }) => (
    <View style={[styles.tableRow, alt && styles.rowAlt]}>
        <Text style={styles.tableCell}>{label}</Text>
        <Text style={styles.tableCellR}>{value}</Text>
    </View>
);

const InvoiceDocument = ({ data }) => {
    const {
        date          = 'Chưa xác định',
        checkOut      = '',
        location      = 'Điểm đến đã chọn',
        adults        = 0,
        children      = 0,
        tourGuide     = 0,
        dinner        = 0,
        tax           = 0,
        subTotal      = 0,
        total         = 0,
        transport     = { title: '', cost: 0 },
        restaurant    = { title: '', cost: 0 },
        hotel         = { title: '', cost: 0 },
        customerName  = '',
        customerEmail = '',
    } = data;

    const issued = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const tripDate = checkOut ? `${date} → ${checkOut}` : date;

    const lineItems = [
        { label: `Người lớn (${adults} người)`,   value: adults  > 0 ? `${adults} pax`  : '—' },
        { label: `Trẻ em (${children} người)`,    value: children > 0 ? `${children} pax` : '—' },
        tourGuide > 0  && { label: 'Hướng dẫn viên',                  value: `${Math.round(tourGuide).toLocaleString('vi-VN')} ₫`  },
        dinner    > 0  && { label: 'Bữa tối',                         value: `${Math.round(dinner).toLocaleString('vi-VN')} ₫`    },
        transport?.title  && { label: `Phương tiện — ${transport.title}`,  value: `${Math.round(transport.cost).toLocaleString('vi-VN')} ₫`  },
        restaurant?.title && { label: `Nhà hàng — ${restaurant.title}`,   value: `${Math.round(restaurant.cost).toLocaleString('vi-VN')} ₫` },
        hotel?.title      && { label: `Khách sạn — ${hotel.title}`,       value: `${Math.round(hotel.cost).toLocaleString('vi-VN')} ₫`      },
        { label: 'Tạm tính',  value: `${Math.round(subTotal).toLocaleString('vi-VN')} ₫` },
        { label: 'Thuế VAT',  value: `${Math.round(tax).toLocaleString('vi-VN')} ₫` },
    ].filter(Boolean);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ── Header ── */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.brand}>DAYTRIP</Text>
                        <Text style={styles.brandSub}>Your journey, our passion</Text>
                    </View>
                    <View style={styles.invoiceBox}>
                        <Text style={styles.invoiceTitle}>HÓA ĐƠN DỊCH VỤ</Text>
                        <Text style={styles.invoiceDate}>Ngày phát hành: {issued}</Text>
                    </View>
                </View>
                <View style={styles.divider} />

                {/* ── Customer + Trip info ── */}
                <View style={styles.infoSection}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Khách hàng</Text>
                        <Text style={styles.infoValue}>{customerName || 'Du Khách'}</Text>
                        {customerEmail ? <Text style={styles.infoSub}>{customerEmail}</Text> : null}
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Điểm đến</Text>
                        <Text style={styles.infoValue}>{location}</Text>
                        <Text style={styles.infoSub}>{tripDate}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Trạng thái</Text>
                        <Text style={[styles.infoValue, { color: '#22c55e' }]}>Đã xác nhận</Text>
                        <Text style={styles.infoSub}>Thanh toán hoàn tất</Text>
                    </View>
                </View>

                {/* ── Line items table ── */}
                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={styles.tableHeadL}>Dịch vụ</Text>
                        <Text style={styles.tableHeadR}>Giá</Text>
                    </View>
                    {lineItems.map((item, i) => (
                        <Row key={i} label={item.label} value={item.value} alt={i % 2 === 1} />
                    ))}
                </View>

                {/* ── Total ── */}
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                    <Text style={styles.totalValue}>{`${Math.round(total).toLocaleString('vi-VN')} ₫`}</Text>
                </View>

                {/* ── Footer ── */}
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.footerText}>DAYTRIP Travel Co. · support@daytrip.vn · (+84) 123456789</Text>
                        <Text style={styles.footerText}>Hủy miễn phí trước 24 giờ · Hoàn tiền trong 24h</Text>
                    </View>
                    <Text style={styles.footerNote}>Cảm ơn bạn đã chọn DAYTRIP!</Text>
                </View>

            </Page>
        </Document>
    );
};

export default InvoiceDocument;
