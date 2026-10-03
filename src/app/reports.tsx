import { api } from '../domain/api';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Section, PrimaryButton } from '../components/UI';
import { ContextBar, Guard, Field, ErrorText, Metric, Bars, Notice } from '../components/Organizer';
import { useWorkspace } from '../state/Workspace';
import { number, type Event } from '../domain/model';
import { buildEventReport, validateReportRange } from '../domain/web/reports';
import { shareCsv } from '../lib/shareCsv';
import { ui } from '../theme';
function ReportForm({ event }: { event: Event }) {
  const [from, setFrom] = useState(event.start_at.slice(0, 10));
  const [to, setTo] = useState(event.end_at.slice(0, 10));
  const [report, setReport] = useState<ReturnType<typeof buildEventReport> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function generate() {
    setError('');
    setReport(null);
    try {
      const errors = Object.values(validateReportRange({ from, to }));
      if (errors.length) throw new Error(String(errors[0]));
      setBusy(true);
      setReport(
        await api<ReturnType<typeof buildEventReport>>(
          `/events/${event.id}/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function download(kind: string) {
    if (!report) return;
    setBusy(true);
    setError('');
    try {
      await shareCsv(
        await api<string>(
          `/events/${event.id}/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&mode=${kind}`,
          { text: true },
        ),
        `eventflow-${kind}-${from}-${to}.csv`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Field
        label="Data od (RRRR-MM-DD)"
        value={from}
        onChangeText={(v) => {
          setFrom(v);
          setReport(null);
        }}
      />
      <Field
        label="Data do (RRRR-MM-DD)"
        value={to}
        onChangeText={(v) => {
          setTo(v);
          setReport(null);
        }}
      />
      <Notice>
        Historia pomiarów jest pobierana z bazy. Wybierz okres obejmujący działanie wydarzenia.
      </Notice>
      <PrimaryButton
        title="Generuj raport"
        icon="bar-chart-outline"
        disabled={busy}
        onPress={() => void generate()}
      />
      <ErrorText value={error} />
      {report && (
        <>
          <Section number="01" title="Podsumowanie" />
          {report.summary.samples ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <Metric
                  label="szczyt łącznej frekwencji"
                  value={number(report.summary.peak_count ?? 0)}
                />
                <Metric label="pomiarów" value={String(report.summary.samples)} />
                <Metric
                  label="stref z pomiarami"
                  value={`${report.summary.measured_zones}/${report.summary.total_zones}`}
                />
              </View>
              {report.summary.partial && (
                <Notice>
                  Niepełne pokrycie pomiarami. Suma obejmuje wyłącznie strefy z próbką w danym
                  momencie.
                </Notice>
              )}
              <Bars
                data={report.timeline.map((p: { timestamp: number; count: number }) => ({
                  label: new Date(p.timestamp).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  value: p.count,
                }))}
              />
              <Section number="02" title="Wyniki stref" />
              {report.zones.map(
                (z: {
                  id: string;
                  name: string;
                  peak: number | null;
                  average: number | null;
                  samples: number;
                }) => (
                  <View key={z.id} style={[ui.card, { gap: 8, marginBottom: 10 }]}>
                    <Text style={ui.text}>{z.name}</Text>
                    <Text style={ui.small}>
                      {z.samples
                        ? `Szczyt: ${number(z.peak ?? 0)} · Średnia: ${number(z.average ?? 0)}`
                        : 'Brak pomiarów'}
                    </Text>
                    <Text style={ui.muted}>{z.samples} próbek</Text>
                  </View>
                ),
              )}
              <View style={{ gap: 12 }}>
                <PrimaryButton
                  title="Eksportuj podsumowanie CSV"
                  icon="download-outline"
                  disabled={busy}
                  onPress={() => void download('summary')}
                />
                <PrimaryButton
                  title="Eksportuj pomiary CSV"
                  icon="share-outline"
                  disabled={busy}
                  onPress={() => void download('measurements')}
                />
              </View>
            </>
          ) : (
            <Notice>Brak pomiarów w wybranym okresie. Eksport jest niedostępny.</Notice>
          )}
        </>
      )}
    </>
  );
}
export default function Reports() {
  const s = useWorkspace();
  return (
    <Screen back title="Raporty wydarzenia" subtitle="Historia frekwencji i eksport danych.">
      <ContextBar />
      <Guard>
        {s.event ? (
          <ReportForm key={s.event.id} event={s.event} />
        ) : (
          <Notice>Wybierz wydarzenie z bazy.</Notice>
        )}
      </Guard>
    </Screen>
  );
}
