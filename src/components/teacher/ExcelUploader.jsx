import { useRef, useState } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import {
  parseExcelFile,
  buildGroups,
  buildTimetableByGroup,
  reconcileGroupNames,
  geocodePlaceNames,
  uniquePlaceNames,
  uploadGroups,
} from '../../lib/excel'
import { useGoogleMapsLoaded } from '../../context/GoogleMapsContext'

function PlaceFixRow({ placeName, onFixed }) {
  const autocompleteRef = useRef(null)

  return (
    <div className="excel-uploader__failed-place-row">
      <span>{placeName}</span>
      <Autocomplete
        onLoad={(instance) => {
          autocompleteRef.current = instance
        }}
        onPlaceChanged={() => {
          const place = autocompleteRef.current?.getPlace()
          if (place) onFixed(place)
        }}
      >
        <input placeholder="장소 검색 후 선택" defaultValue={placeName} />
      </Autocomplete>
    </div>
  )
}

const STATUS_LABEL = {
  ok: '등록완료',
  geocode_failed: '등록완료 (좌표변환 실패 있음)',
  error: '실패',
  account_error: '계정 생성 실패',
}

export default function ExcelUploader() {
  const isMapsLoaded = useGoogleMapsLoaded()
  const [step, setStep] = useState('idle') // idle | parsed | geocoding | ready | uploading | done
  const [groups, setGroups] = useState([])
  const [timetableByGroup, setTimetableByGroup] = useState({})
  const [reconciliation, setReconciliation] = useState(null)
  const [geocodeResults, setGeocodeResults] = useState({})
  const [uploadResults, setUploadResults] = useState([])
  const [error, setError] = useState('')

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      const buffer = await file.arrayBuffer()
      const { groupRows, timetableRows } = parseExcelFile(buffer)
      const parsedGroups = buildGroups(groupRows)
      const timetable = buildTimetableByGroup(timetableRows)
      setGroups(parsedGroups)
      setTimetableByGroup(timetable)
      setReconciliation(reconcileGroupNames(parsedGroups, timetable))
      setGeocodeResults({})
      setUploadResults([])
      setStep('parsed')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleGeocode() {
    setStep('geocoding')
    const places = uniquePlaceNames(timetableByGroup)
    const results = await geocodePlaceNames(places)
    setGeocodeResults(results)
    setStep('ready')
  }

  function handleManualPlaceFix(placeName, place) {
    if (!place?.geometry?.location) return
    setGeocodeResults((prev) => ({
      ...prev,
      [placeName]: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        status: 'ok',
      },
    }))
  }

  async function handleUpload() {
    setStep('uploading')
    const results = await uploadGroups(groups, timetableByGroup, geocodeResults)
    setUploadResults(results)
    setStep('done')
  }

  const failedPlaces = Object.entries(geocodeResults).filter(([, v]) => v.status === 'failed')

  return (
    <div className="excel-uploader">
      <h2>모둠 계획서 Excel 업로드</h2>
      <input type="file" accept=".xlsx" onChange={handleFileChange} />
      {error && <p className="excel-uploader__error">{error}</p>}

      {reconciliation && (
        <div className="excel-uploader__reconcile">
          <p>인식된 모둠명: {reconciliation.common.length}개</p>
          {reconciliation.hasMismatch && (
            <div className="excel-uploader__mismatch">
              <p>⚠ 모둠명이 시트 간에 일치하지 않습니다 (오타 확인 필요):</p>
              {reconciliation.onlyInGroups.length > 0 && (
                <p>모둠정보 시트에만 있음: {reconciliation.onlyInGroups.join(', ')}</p>
              )}
              {reconciliation.onlyInTimetable.length > 0 && (
                <p>타임테이블 시트에만 있음: {reconciliation.onlyInTimetable.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'parsed' && (
        <button type="button" onClick={handleGeocode} disabled={!isMapsLoaded}>
          장소 좌표 변환하기
        </button>
      )}

      {step === 'geocoding' && <p>좌표 변환 중...</p>}

      {(step === 'ready' || step === 'uploading' || step === 'done') && failedPlaces.length > 0 && (
        <div className="excel-uploader__failed-places">
          <p>좌표 변환 실패한 장소 (직접 검색해서 수정):</p>
          {failedPlaces.map(([placeName]) => (
            <PlaceFixRow
              key={placeName}
              placeName={placeName}
              onFixed={(place) => handleManualPlaceFix(placeName, place)}
            />
          ))}
        </div>
      )}

      {step === 'ready' && (
        <button type="button" onClick={handleUpload}>
          업로드 확정
        </button>
      )}

      {step === 'uploading' && <p>업로드 중...</p>}

      {step === 'done' && (
        <table className="excel-uploader__result-table">
          <thead>
            <tr>
              <th>모둠</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {uploadResults.map((r) => (
              <tr key={r.name} className={r.status === 'ok' ? '' : 'is-warning'}>
                <td>{r.name}</td>
                <td>{STATUS_LABEL[r.status] ?? r.status}{r.message ? ` — ${r.message}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
